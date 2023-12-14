'use client';

import { Controller, useForm } from 'react-hook-form';

import { DATE_FORMATS } from '@documenso/lib/constants/date-formats';
import { TIME_ZONES_FULL } from '@documenso/lib/constants/time-zones';
import type { Field, Recipient } from '@documenso/prisma/client';
import { DocumentStatus, SendStatus } from '@documenso/prisma/client';
import type { DocumentWithData } from '@documenso/prisma/types/document-with-data';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@documenso/ui/primitives/accordion';
import { FormErrorMessage } from '@documenso/ui/primitives/form/form-error-message';
import { Input } from '@documenso/ui/primitives/input';
import { Label } from '@documenso/ui/primitives/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@documenso/ui/primitives/select';
import { Textarea } from '@documenso/ui/primitives/textarea';

import { Combobox } from '../combobox';
import type { TAddSubjectFormSchema } from './add-subject.types';
import {
  DocumentFlowFormContainerActions,
  DocumentFlowFormContainerContent,
  DocumentFlowFormContainerFooter,
  DocumentFlowFormContainerStep,
} from './document-flow-root';
import type { DocumentFlowStep } from './types';

export type AddSubjectFormProps = {
  documentFlow: DocumentFlowStep;
  recipients: Recipient[];
  fields: Field[];
  document: DocumentWithData;
  numberOfSteps: number;
  onSubmit: (_data: TAddSubjectFormSchema) => void;
};

export const AddSubjectFormPartial = ({
  documentFlow,
  recipients: recipients,
  fields: _fields,
  document,
  numberOfSteps,
  onSubmit,
}: AddSubjectFormProps) => {
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    getValues,
    setValue,
  } = useForm<TAddSubjectFormSchema>({
    defaultValues: {
      meta: {
        subject: document.documentMeta?.subject ?? '',
        message: document.documentMeta?.message ?? '',
        timezone: document.documentMeta?.timezone ?? 'Etc/UTC',
        dateFormat: document.documentMeta?.dateFormat ?? 'yyyy-MM-dd hh:mm a',
      },
    },
  });

  const onFormSubmit = handleSubmit(onSubmit);

  const hasDateField = _fields.find((field) => field.type === 'DATE');

  const documentHasBeenSent = recipients.some(
    (recipient) => recipient.sendStatus === SendStatus.SENT,
  );

  return (
    <>
      <DocumentFlowFormContainerContent>
        <div className="flex flex-col">
          <div className="flex flex-col gap-y-4">
            <div>
              <Label htmlFor="subject">
                Subject <span className="text-muted-foreground">(Optional)</span>
              </Label>

              <Input
                id="subject"
                // placeholder="Subject"
                className="bg-background mt-2"
                disabled={isSubmitting}
                {...register('meta.subject')}
              />

              <FormErrorMessage className="mt-2" error={errors.meta?.subject} />
            </div>

            <div>
              <Label htmlFor="message">
                Message <span className="text-muted-foreground">(Optional)</span>
              </Label>

              <Textarea
                id="message"
                className="bg-background mt-2 h-32 resize-none"
                disabled={isSubmitting}
                {...register('meta.message')}
              />

              <FormErrorMessage
                className="mt-2"
                error={typeof errors.meta?.message !== 'string' ? errors.meta?.message : undefined}
              />
            </div>

            <div>
              <p className="text-muted-foreground text-sm">
                You can use the following variables in your message:
              </p>

              <ul className="mt-2 flex list-inside list-disc flex-col gap-y-2 text-sm">
                <li className="text-muted-foreground">
                  <code className="text-muted-foreground bg-muted-foreground/20 rounded p-1 text-sm">
                    {'{signer.name}'}
                  </code>{' '}
                  - The signer's name
                </li>
                <li className="text-muted-foreground">
                  <code className="text-muted-foreground bg-muted-foreground/20 rounded p-1 text-sm">
                    {'{signer.meta}'}
                  </code>{' '}
                  - The signer's meta
                </li>
                <li className="text-muted-foreground">
                  <code className="text-muted-foreground bg-muted-foreground/20 rounded p-1 text-sm">
                    {'{document.name}'}
                  </code>{' '}
                  - The document's name
                </li>
              </ul>
            </div>

            <Accordion type="multiple" className="mt-8">
              <AccordionItem value="advanced-options no-underline">
                <AccordionTrigger className="text-md text-left no-underline">
                  Advanced Options
                </AccordionTrigger>

                <AccordionContent className="text-muted-foreground max-w-prose text-sm leading-relaxed">
                  {hasDateField && (
                    <div className="mt-2 flex flex-col">
                      <Label htmlFor="date-format">
                        Date Format <span className="text-muted-foreground">(Optional)</span>
                      </Label>

                      <Controller
                        control={control}
                        name={`meta.dateFormat`}
                        render={({ field }) => (
                          <Select
                            defaultValue={getValues('meta.dateFormat')}
                            onValueChange={(value) => setValue('meta.dateFormat', value)}
                            disabled={documentHasBeenSent}
                            {...field}
                          >
                            <SelectTrigger className="bg-background mt-2">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {DATE_FORMATS.map((format) => (
                                <SelectItem key={format.key} value={format.value}>
                                  {format.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                  )}

                  {hasDateField && (
                    <div className="mt-4 flex flex-col">
                      <Label htmlFor="time-zone">
                        Time Zone <span className="text-muted-foreground">(Optional)</span>
                      </Label>

                      <Controller
                        control={control}
                        name={`meta.timezone`}
                        render={({ field: { onChange } }) => (
                          <Combobox
                            listValues={TIME_ZONES_FULL}
                            onChange={(value) => onChange(setValue('meta.timezone', value))}
                            selectedValue={getValues('meta.timezone')}
                            disabled={documentHasBeenSent}
                          />
                        )}
                      />
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </DocumentFlowFormContainerContent>

      <DocumentFlowFormContainerFooter>
        <DocumentFlowFormContainerStep
          title={documentFlow.title}
          step={documentFlow.stepIndex}
          maxStep={numberOfSteps}
        />

        <DocumentFlowFormContainerActions
          loading={isSubmitting}
          disabled={isSubmitting}
          goNextLabel={document.status === DocumentStatus.DRAFT ? 'Send' : 'Update'}
          onGoBackClick={documentFlow.onBackStep}
          onGoNextClick={() => void onFormSubmit()}
        />
      </DocumentFlowFormContainerFooter>
    </>
  );
};
