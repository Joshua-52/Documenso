'use client';

import React from 'react';

import Link from 'next/link';

import { Clock8 } from 'lucide-react';
import { useSession } from 'next-auth/react';

import signingCelebration from '@documenso/assets/images/signing-celebration.png';
import type { Document, Signature } from '@documenso/prisma/client';
import { SigningCard3D } from '@documenso/ui/components/signing-card';

type NoLongerAvailableProps = {
  document: Document;
  recipientName: string;
  recipientSignature: Signature;
};

export const NoLongerAvailable = ({
  document,
  recipientName,
  recipientSignature,
}: NoLongerAvailableProps) => {
  const { data: session } = useSession();

  return (
    <div className="-mx-4 flex max-w-[100vw] flex-col items-center overflow-x-hidden px-4 pt-16 md:-mx-8 md:px-8 lg:pt-16 xl:pt-24">
      <SigningCard3D
        name={recipientName}
        signature={recipientSignature}
        signingCelebrationImage={signingCelebration}
      />

      <div className="relative mt-2 flex w-full flex-col items-center">
        <div className="mt-8 flex items-center text-center text-red-600">
          <Clock8 className="mr-2 h-5 w-5" />
          <span className="text-sm">დოკუმენტი გაუქმებულია</span>
        </div>

        <h2 className="mt-6 max-w-[35ch] text-center text-2xl font-semibold leading-normal md:text-3xl lg:text-4xl">
          <span className="mt-1.5 block">"{document.title}"</span>
          აღარ არის ხელმისაწვდომი
        </h2>

        <p className="text-muted-foreground/60 mt-2.5 max-w-[60ch] text-center text-sm font-medium md:text-base">
          ეს დოკუმენტი გააუქმა მფლობელმა
        </p>

        {session?.user ? (
          <Link href="/documents" className="text-documenso-700 hover:text-documenso-600 mt-36">
            მთავარზე დაბრუნება
          </Link>
        ) : (
          <p className="text-muted-foreground/60 mt-36 text-sm">
            გსურთ გააგზავნოთ ამ ხელმოწერის მსგავსი ბმულები?{' '}
            <Link
              href="https://documenso.com"
              className="text-documenso-700 hover:text-documenso-600"
            >
              შემოგვიერთდით SignStream-ზე.
            </Link>
          </p>
        )}
      </div>
    </div>
  );
};
