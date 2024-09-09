'use client';

import { useEffect, useTransition } from 'react';

import { useRouter } from 'next/navigation';

import { Trans, msg } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { Loader } from 'lucide-react';

import { DO_NOT_INVALIDATE_QUERY_ON_MUTATION } from '@documenso/lib/constants/trpc';
import { AppError, AppErrorCode } from '@documenso/lib/errors/app-error';
import type { TRecipientActionAuth } from '@documenso/lib/types/document-auth';
import type { Recipient } from '@documenso/prisma/client';
import type { FieldWithSignature } from '@documenso/prisma/types/field-with-signature';
import { trpc } from '@documenso/trpc/react';
import type { TSignFieldWithTokenMutationSchema } from '@documenso/trpc/server/field-router/schema';
import { useToast } from '@documenso/ui/primitives/use-toast';

import { useRequiredDocumentAuthContext } from './document-auth-provider';
import { useRequiredSigningContext } from './provider';
import { SigningFieldContainer } from './signing-field-container';

export type EmailFieldProps = {
  field: FieldWithSignature;
  recipient: Recipient;
  onSignField?: (value: TSignFieldWithTokenMutationSchema) => Promise<void> | void;
};

export const EmailField = ({ field, recipient, onSignField }: EmailFieldProps) => {
  const router = useRouter();

  const { _ } = useLingui();
  const { toast } = useToast();

  const { email: providedEmail } = useRequiredSigningContext();

  const [isPending, startTransition] = useTransition();

  const { mutateAsync: signFieldWithToken, isLoading: isSignFieldWithTokenLoading } =
    trpc.field.signFieldWithToken.useMutation(DO_NOT_INVALIDATE_QUERY_ON_MUTATION);

  const { isLoading: isRemoveSignedFieldWithTokenLoading } =
    trpc.field.removeSignedFieldWithToken.useMutation(DO_NOT_INVALIDATE_QUERY_ON_MUTATION);

  const isLoading = isSignFieldWithTokenLoading || isRemoveSignedFieldWithTokenLoading || isPending;

  const { executeActionAuthProcedure } = useRequiredDocumentAuthContext();

  const onSign = async (authOptions?: TRecipientActionAuth) => {
    try {
      const value = providedEmail ?? '';

      const payload: TSignFieldWithTokenMutationSchema = {
        token: recipient.token,
        fieldId: field.id,
        value,
        isBase64: false,
        authOptions,
      };

      if (onSignField) {
        await onSignField(payload);
        return;
      }

      await signFieldWithToken(payload);

      startTransition(() => router.refresh());
    } catch (err) {
      const error = AppError.parseError(err);

      if (error.code === AppErrorCode.UNAUTHORIZED) {
        throw error;
      }

      console.error(err);

      toast({
        title: _(msg`Error`),
        description: _(msg`An error occurred while signing the document.`),
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    if (!field.inserted) {
      void executeActionAuthProcedure({
        onReauthFormSubmit: async (authOptions) => await onSign(authOptions),
        actionTarget: field.type,
      });
    }
  }, [field]);

  return (
    <SigningFieldContainer field={field} type="Email">
      {isLoading && (
        <div className="bg-background absolute inset-0 flex items-center justify-center rounded-md">
          <Loader className="text-primary h-5 w-5 animate-spin md:h-8 md:w-8" />
        </div>
      )}

      {!field.inserted && (
        <p className="group-hover:text-primary text-muted-foreground duration-200 group-hover:text-yellow-300">
          <Trans>Email</Trans>
        </p>
      )}

      {field.inserted && (
        <p className="text-muted-foreground dark:text-background/80 truncate duration-200">
          {field.customText}
        </p>
      )}
    </SigningFieldContainer>
  );
};
