'use client';

import { type HTMLAttributes, useEffect, useState } from 'react';

import { SignatureType } from '@prisma/client';
import { TabsContent } from '@radix-ui/react-tabs';
import { UploadIcon } from 'lucide-react';

import { base64 } from '@documenso/lib/universal/base64';
import { SignatureIcon } from '@documenso/ui/icons/signature';

import { cn } from '../../lib/utils';
import { Card, CardContent } from '../card';
import { SignatureDropzone } from '../signature-dropzone';
import { Tabs, TabsList, TabsTrigger } from '../tabs';
import { DrawPad } from './drawpad';

export type SignaturePadProps = Omit<HTMLAttributes<HTMLCanvasElement>, 'onChange'> & {
  containerClassName?: string;
  signature: { value: string | null; type: SignatureType };
  disabled?: boolean;
  uploadDisable?: boolean;
  onChange?: (_signatureDataUrl: string | null, isUploaded: boolean) => void;
};

export const SignaturePad = ({
  className,
  containerClassName,
  onChange,
  disabled = false,
  uploadDisable = false,
  signature,
  ...props
}: SignaturePadProps) => {
  const [uploadedFile, setUploadedFile] = useState<string | null>(
    signature.type === SignatureType.UPLOAD ? signature.value : null,
  );

  const onSignatureDrop = async (file: File) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const base64String = base64.encode(new Uint8Array(arrayBuffer));

      setUploadedFile(`data:image/png;base64,${base64String}`);
      onChange?.(`data:image/png;base64,${base64String}`, true);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (signature.type === SignatureType.DRAW && uploadedFile !== null) {
      setUploadedFile(null);
    }
  }, [signature.type]);

  return (
    <div className={cn('relative block', containerClassName)}>
      <Tabs defaultValue={signature?.type ?? undefined} className="overflow-x-auto">
        <TabsList className="m-2">
          <TabsTrigger value={SignatureType.DRAW}>
            <SignatureIcon className="text-muted-foreground mr-2 inline-block h-4 w-4" />
            Draw
          </TabsTrigger>
          <TabsTrigger value={SignatureType.UPLOAD} disabled={uploadDisable}>
            <UploadIcon className="text-muted-foreground mr-2 inline-block h-4 w-4" />
            Upload
          </TabsTrigger>
        </TabsList>
        <TabsContent value={SignatureType.DRAW}>
          <DrawPad onChange={onChange} signature={signature} className={className} {...props} />
        </TabsContent>
        <TabsContent value={SignatureType.UPLOAD}>
          {uploadedFile ? (
            <Card
              id={`field-card-${signature.type}-signature`}
              className={cn(
                'field-card-container bg-background relative z-20 h-full w-full border-0 transition-all',
              )}
            >
              <CardContent className="text-foreground hover:shadow-primary-foreground group flex h-full w-full flex-col items-center justify-center p-2">
                <img
                  src={uploadedFile ?? ''}
                  className="bg-background h-40 w-full rounded-lg border"
                />
                <button
                  type="button"
                  className="text-destructive bg-background/40 absolute inset-0 z-10 flex h-full w-full items-center justify-center rounded-md text-sm opacity-0 backdrop-blur-sm duration-200 group-hover:opacity-100"
                  onClick={() => {
                    onChange?.('', true);
                    setUploadedFile(null);
                  }}
                >
                  Remove
                </button>
              </CardContent>
            </Card>
          ) : (
            <SignatureDropzone onDrop={onSignatureDrop} className={className} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
