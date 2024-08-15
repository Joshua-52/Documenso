import { useState } from 'react';

import type { Field } from '@documenso/prisma/client';
import { RecipientRole } from '@documenso/prisma/client';
import { Button } from '@documenso/ui/primitives/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from '@documenso/ui/primitives/dialog';

import { SigningDisclosure } from '~/components/general/signing-disclosure';
import { truncateTitle } from '~/helpers/truncate-title';

export type SignDialogProps = {
  isSubmitting: boolean;
  documentTitle: string;
  fields: Field[];
  fieldsValidated: () => void | Promise<void>;
  onSignatureComplete: () => void | Promise<void>;
  role: RecipientRole;
};

export const SignDialog = ({
  isSubmitting,
  documentTitle,
  fields,
  fieldsValidated,
  onSignatureComplete,
  role,
}: SignDialogProps) => {
  const [showDialog, setShowDialog] = useState(false);
  const truncatedTitle = truncateTitle(documentTitle);
  const isComplete = fields.every((field) => field.inserted);

  const handleOpenChange = (open: boolean) => {
    if (isSubmitting || !isComplete) {
      return;
    }

    setShowDialog(open);
  };

  return (
    <Dialog open={showDialog} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          className="w-full"
          type="button"
          size="lg"
          onClick={fieldsValidated}
          loading={isSubmitting}
        >
          {isComplete ? 'დასრულება' : 'შემდეგი ველი'}
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogTitle>
          <div className="text-foreground text-xl font-semibold">
            {role === RecipientRole.VIEWER && 'დაასრულეთ ნახვა'}
            {/* {role === RecipientRole.VIEWER && 'Complete Viewing'} */}
            {role === RecipientRole.SIGNER && 'დაასრულეთ ხელმოწერა'}
            {/* {role === RecipientRole.SIGNER && 'Complete Signing'} */}
            {role === RecipientRole.APPROVER && 'დაასრულეთ დადასტურება'}
            {/* {role === RecipientRole.APPROVER && 'Complete Approval'} */}
          </div>
        </DialogTitle>

        <div className="text-muted-foreground max-w-[50ch]">
          {role === RecipientRole.VIEWER && (
            <span>
              თქვენ ახლა დაასრულებთ "{truncatedTitle}"-ის ხილვას.
              {/* You are about to complete viewing "{truncatedTitle}". */}
              <br /> დარწმუნდით სანამ განაგრძობთ.
            </span>
          )}
          {role === RecipientRole.SIGNER && (
            <span>
              თქვენ ახლა ხელს მოაწერთ "{truncatedTitle}"-ს.
              {/* You are about to complete signing "{truncatedTitle}". */}
              <br /> დარწმუნდით სანამ განაგრძობთ.
            </span>
          )}
          {role === RecipientRole.APPROVER && (
            <span>
              თქვენ ახლა დაამტკიცებთ "{truncatedTitle}"-ს.
              {/* You are about to complete approving "{truncatedTitle}". */}
              <br /> დარწმუნდით სანამ განაგრძობთ.
            </span>
          )}
        </div>

        <SigningDisclosure className="mt-4" />

        <DialogFooter>
          <div className="flex w-full flex-1 flex-nowrap gap-4">
            <Button
              type="button"
              className="dark:bg-muted dark:hover:bg-muted/80 flex-1  bg-black/5 hover:bg-black/10"
              variant="secondary"
              onClick={() => {
                setShowDialog(false);
              }}
            >
              დახურვა
            </Button>

            <Button
              type="button"
              className="flex-1"
              disabled={!isComplete}
              loading={isSubmitting}
              onClick={onSignatureComplete}
            >
              {role === RecipientRole.VIEWER && 'ნანახად მონიშვნა'}
              {role === RecipientRole.SIGNER && 'ხელის მოწერა'}
              {/* {role === RecipientRole.APPROVER && 'Approve'} */}
              {role === RecipientRole.APPROVER && 'დამტკიცება'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
