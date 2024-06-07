'use client';

import { useEffect, useState, useTransition } from 'react';

import { useRouter } from 'next/navigation';

import { Loader } from 'lucide-react';

import { DO_NOT_INVALIDATE_QUERY_ON_MUTATION } from '@documenso/lib/constants/trpc';
import { AppError, AppErrorCode } from '@documenso/lib/errors/app-error';
import type { TRecipientActionAuth } from '@documenso/lib/types/document-auth';
import { ZRadioFieldMeta } from '@documenso/lib/types/field-field-meta';
import type { Recipient } from '@documenso/prisma/client';
import type { FieldWithSignatureAndFieldMeta } from '@documenso/prisma/types/field-with-signature-and-fieldmeta';
import { trpc } from '@documenso/trpc/react';
import type {
  TRemovedSignedFieldWithTokenMutationSchema,
  TSignFieldWithTokenMutationSchema,
} from '@documenso/trpc/server/field-router/schema';
import { cn } from '@documenso/ui/lib/utils';
import { Card, CardContent } from '@documenso/ui/primitives/card';
import { Label } from '@documenso/ui/primitives/label';
import { RadioGroup, RadioGroupItem } from '@documenso/ui/primitives/radio-group';
import { useToast } from '@documenso/ui/primitives/use-toast';

import { useRequiredDocumentAuthContext } from './document-auth-provider';
import { SigningFieldContainer } from './signing-field-container';

export type RadioFieldProps = {
  field: FieldWithSignatureAndFieldMeta;
  recipient: Recipient;
  onSignField?: (value: TSignFieldWithTokenMutationSchema) => Promise<void> | void;
  onUnsignField?: (value: TRemovedSignedFieldWithTokenMutationSchema) => Promise<void> | void;
};

export const RadioField = ({ field, recipient, onSignField, onUnsignField }: RadioFieldProps) => {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const parsedFieldMeta = ZRadioFieldMeta.parse(field.fieldMeta);
  const defaultValue = parsedFieldMeta.values?.filter((item) => item.checked === true)[0].value;

  const [selectedOption, setSelectedOption] = useState(defaultValue || '');
  const [optionSelected, setOptionSelected] = useState(false);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);

  const { executeActionAuthProcedure } = useRequiredDocumentAuthContext();

  const { mutateAsync: signFieldWithToken, isLoading: isSignFieldWithTokenLoading } =
    trpc.field.signFieldWithToken.useMutation(DO_NOT_INVALIDATE_QUERY_ON_MUTATION);

  const {
    mutateAsync: removeSignedFieldWithToken,
    isLoading: isRemoveSignedFieldWithTokenLoading,
  } = trpc.field.removeSignedFieldWithToken.useMutation(DO_NOT_INVALIDATE_QUERY_ON_MUTATION);

  const isLoading = isSignFieldWithTokenLoading || isRemoveSignedFieldWithTokenLoading || isPending;
  const shouldAutoSignField =
    (!field.inserted && optionSelected) ||
    (!field.inserted && defaultValue) ||
    (!field.inserted && parsedFieldMeta.readOnly && defaultValue);

  const onSign = async (authOptions?: TRecipientActionAuth) => {
    try {
      if (!selectedOption) {
        return;
      }

      const payload: TSignFieldWithTokenMutationSchema = {
        token: recipient.token,
        fieldId: field.id,
        value: selectedOption === 'empty-value' ? '' : selectedOption,
        isBase64: true,
        authOptions,
      };

      if (onSignField) {
        await onSignField(payload);
        return;
      }

      await signFieldWithToken(payload);

      setSelectedOption('');

      startTransition(() => router.refresh());
    } catch (err) {
      const error = AppError.parseError(err);

      if (error.code === AppErrorCode.UNAUTHORIZED) {
        throw error;
      }

      console.error(err);

      toast({
        title: 'Error',
        description: 'An error occurred while signing the document.',
        variant: 'destructive',
      });
    }
  };

  const onRemove = async () => {
    try {
      const payload: TRemovedSignedFieldWithTokenMutationSchema = {
        token: recipient.token,
        fieldId: field.id,
      };

      if (onUnsignField) {
        await onUnsignField(payload);
        return;
      }

      await removeSignedFieldWithToken(payload);

      setSelectedOption('');
      setSelectedOptionIndex(null);

      startTransition(() => router.refresh());
    } catch (err) {
      console.error(err);

      toast({
        title: 'Error',
        description: 'An error occurred while removing the signature.',
        variant: 'destructive',
      });
    }
  };

  const handleSelectItem = (selectedOption: string) => {
    setSelectedOption(selectedOption);
    setOptionSelected(true);
  };

  useEffect(() => {
    if (shouldAutoSignField) {
      void executeActionAuthProcedure({
        onReauthFormSubmit: async (authOptions) => await onSign(authOptions),
        actionTarget: field.type,
      });
      setOptionSelected(false);
    }
  }, [optionSelected]);

  return (
    <SigningFieldContainer field={field} onSign={onSign} onRemove={onRemove} type="Radio">
      {isLoading && (
        <div className="bg-background absolute inset-0 z-20 flex items-center justify-center rounded-md">
          <Loader className="text-primary h-5 w-5 animate-spin md:h-8 md:w-8" />
        </div>
      )}

      {!field.inserted && (
        <RadioGroup
          onValueChange={(value) => {
            if (value) {
              handleSelectItem(value);
            } else {
              handleSelectItem('empty-value');
            }
          }}
          className="z-10"
        >
          {parsedFieldMeta.values?.map((item, index) => (
            <Card
              id={String(index)}
              key={index}
              className={cn(
                'm-1 p-2',
                {
                  'border-yellow-300 ring-2 ring-yellow-100 ring-offset-2 ring-offset-yellow-100':
                    !field.inserted,
                },
                {
                  'border-red-500 ring-2 ring-red-200 ring-offset-2 ring-offset-red-200 hover:text-red-500':
                    !field.inserted && parsedFieldMeta.required,
                },
              )}
            >
              <CardContent
                className={cn(
                  'text-muted-foreground dark:text-foreground/80 hover:shadow-primary-foreground group flex h-full w-full flex-row items-center space-x-2 p-2',
                  {
                    'hover:text-red-300': !field.inserted && parsedFieldMeta.required,
                  },
                  {
                    'hover:text-yellow-300': !field.inserted && !parsedFieldMeta.required,
                  },
                )}
              >
                <RadioGroupItem
                  className="data-[state=checked]:ring-documenso data-[state=checked]:bg-documenso h-5 w-5 shrink-0 data-[state=checked]:ring-1 data-[state=checked]:ring-offset-2"
                  value={item.value}
                  id={`option-${index}`}
                  checked={item.checked}
                  onClick={() => setSelectedOptionIndex(index)}
                />
                <Label htmlFor={`option-${index}`}>{item.value}</Label>
              </CardContent>
            </Card>
          ))}
        </RadioGroup>
      )}

      {field.inserted && (
        <RadioGroup>
          {parsedFieldMeta.values?.map((item, index) => (
            <Card
              id={String(index)}
              key={index}
              className={cn(
                'text-muted-foreground m-1 flex items-center justify-center p-2',
                {
                  'border-documenso ring-documenso-200 ring-offset-documenso-200 dark:text-foreground/80 ring-2 ring-offset-2':
                    field.inserted,
                },
                {
                  'bg-documenso/20 border-documenso dark:text-background/80':
                    field.inserted && item.value.length > 0
                      ? item.value === field.customText
                      : selectedOptionIndex === index,
                },
              )}
            >
              <CardContent className="flex h-full w-full flex-row items-center space-x-2 p-2">
                <RadioGroupItem
                  className="data-[state=checked]:ring-documenso data-[state=checked]:bg-documenso dark:data-[state=checked]:border-documenso h-5 w-5 shrink-0 data-[state=checked]:ring-1 data-[state=checked]:ring-offset-2 dark:data-[state=checked]:ring-offset-white"
                  value={item.value}
                  id={`option-${index}`}
                  checked={
                    item.value.length > 0
                      ? item.value === field.customText
                      : selectedOptionIndex === index
                  }
                />
                <Label htmlFor={`option-${index}`}>{item.value}</Label>
              </CardContent>
            </Card>
          ))}
        </RadioGroup>
      )}
    </SigningFieldContainer>
  );
};
