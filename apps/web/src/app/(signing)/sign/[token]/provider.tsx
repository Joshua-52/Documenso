'use client';

import { createContext, useContext, useState } from 'react';

export type SigningContextValue = {
  fullName: string;
  setFullName: (_value: string) => void;
  email: string;
  setEmail: (_value: string) => void;
  signature: string | null;
  setSignature: (_value: string | null) => void;
  dateFormat: string;
  setDateFormat: (_value: string) => void;
  timeZone: string;
  setTimeZone: (_value: string) => void;
};

const SigningContext = createContext<SigningContextValue | null>(null);

export const useSigningContext = () => {
  return useContext(SigningContext);
};

export const useRequiredSigningContext = () => {
  const context = useSigningContext();

  if (!context) {
    throw new Error('Signing context is required');
  }

  return context;
};

export interface SigningProviderProps {
  fullName?: string | null;
  email?: string | null;
  signature?: string | null;
  dateFormat?: string | null;
  timeZone?: string | null;
  children: React.ReactNode;
}

export const SigningProvider = ({
  fullName: initialFullName,
  email: initialEmail,
  signature: initialSignature,
  dateFormat: initialDateFormat,
  timeZone: initialTimeZone,
  children,
}: SigningProviderProps) => {
  const [fullName, setFullName] = useState(initialFullName || '');
  const [email, setEmail] = useState(initialEmail || '');
  const [signature, setSignature] = useState(initialSignature || null);
  const [dateFormat, setDateFormat] = useState(initialDateFormat || 'yyyy-MM-dd hh:mm a');
  const [timeZone, setTimeZone] = useState(initialTimeZone || '');

  return (
    <SigningContext.Provider
      value={{
        fullName,
        setFullName,
        email,
        setEmail,
        signature,
        setSignature,
        dateFormat,
        setDateFormat,
        timeZone,
        setTimeZone,
      }}
    >
      {children}
    </SigningContext.Provider>
  );
};

SigningProvider.displayName = 'SigningProvider';
