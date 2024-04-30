import { nanoid } from '@documenso/lib/universal/id';
import { prisma } from '@documenso/prisma';
import type { RecipientRole } from '@documenso/prisma/client';

export type CreateDocumentFromTemplateOptions = {
  templateId: number;
  userId: number;
  teamId?: number;
  recipients?: {
    name?: string;
    email: string;
    role?: RecipientRole;
  }[];
};

export const createDocumentFromTemplate = async ({
  templateId,
  userId,
  teamId,
  recipients,
}: CreateDocumentFromTemplateOptions) => {
  const template = await prisma.template.findUnique({
    where: {
      id: templateId,
      ...(teamId
        ? {
            team: {
              id: teamId,
              members: {
                some: {
                  userId,
                },
              },
            },
          }
        : {
            userId,
            teamId: null,
          }),
    },
    include: {
      Recipient: true,
      Field: true,
      templateDocumentData: true,
      templateDocumentMeta: true,
    },
  });

  if (!template) {
    throw new Error('Template not found.');
  }

  const documentData = await prisma.documentData.create({
    data: {
      type: template.templateDocumentData.type,
      data: template.templateDocumentData.data,
      initialData: template.templateDocumentData.initialData,
    },
  });

  // const templateDocumentMeta = await prisma.documentMeta.create({
  //   data: {
  //     subject: template.templateDocumentMeta.subject,
  //     message: template.templateDocumentMeta.message,
  //     timezone: template.templateDocumentMeta.timezone,
  //     password: template.templateDocumentMeta.password,
  //     dateFormat: template.templateDocumentMeta.dateFormat,
  //     redirectUrl: template.templateDocumentMeta.redirectUrl,
  //   },
  // });

  const document = await prisma.document.create({
    data: {
      userId,
      teamId: template.teamId,
      title: template.title,
      documentDataId: documentData.id,
      // documentMeta: templateDocumentMeta,
      Recipient: {
        create: template.Recipient.map((recipient) => ({
          email: recipient.email,
          name: recipient.name,
          role: recipient.role,
          token: nanoid(),
        })),
      },
    },

    include: {
      Recipient: {
        orderBy: {
          id: 'asc',
        },
      },
      documentData: true,
    },
  });

  await prisma.field.createMany({
    data: template.Field.map((field) => {
      const recipient = template.Recipient.find((recipient) => recipient.id === field.recipientId);

      const documentRecipient = document.Recipient.find((doc) => doc.email === recipient?.email);

      if (!documentRecipient) {
        throw new Error('Recipient not found.');
      }

      return {
        type: field.type,
        page: field.page,
        positionX: field.positionX,
        positionY: field.positionY,
        width: field.width,
        height: field.height,
        customText: field.customText,
        inserted: field.inserted,
        documentId: document.id,
        recipientId: documentRecipient.id,
      };
    }),
  });

  if (recipients && recipients.length > 0) {
    document.Recipient = await Promise.all(
      recipients.map(async (recipient, index) => {
        const existingRecipient = document.Recipient.at(index);

        return await prisma.recipient.upsert({
          where: {
            documentId_email: {
              documentId: document.id,
              email: existingRecipient?.email ?? recipient.email,
            },
          },
          update: {
            name: recipient.name,
            email: recipient.email,
            role: recipient.role,
          },
          create: {
            documentId: document.id,
            email: recipient.email,
            name: recipient.name,
            role: recipient.role,
            token: nanoid(),
          },
        });
      }),
    );
  }

  return document;
};
