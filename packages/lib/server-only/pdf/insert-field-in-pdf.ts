// https://github.com/Hopding/pdf-lib/issues/20#issuecomment-412852821
import fontkit from '@pdf-lib/fontkit';
import { PDFDocument } from 'pdf-lib';
import type { PDFFont, PDFPage } from 'pdf-lib';

import {
  DEFAULT_HANDWRITING_FONT_SIZE,
  DEFAULT_STANDARD_FONT_SIZE,
  MIN_HANDWRITING_FONT_SIZE,
  MIN_STANDARD_FONT_SIZE,
} from '@documenso/lib/constants/pdf';
import { FieldType } from '@documenso/prisma/client';
import { isSignatureFieldType } from '@documenso/prisma/guards/is-signature-field';
import type { FieldWithSignature } from '@documenso/prisma/types/field-with-signature';

const CHECKBOX_MARK = 'X';
const RADIO_MARK = 'O';
const MARK_FONT_SIZE = 20;
const MARK_OFFSET = 40;

const handleCheckboxField = (
  page: PDFPage,
  fieldX: number,
  fieldY: number,
  fieldWidth: number,
  fieldHeight: number,
  pageHeight: number,
  font: PDFFont,
  checkboxValues: string[],
) => {
  const lineHeight = font.heightAtSize(MARK_FONT_SIZE);
  let currentY = fieldY;
  const spaceBetweenMarkAndText = 10;

  for (const value of checkboxValues) {
    const checkboxMarkX = fieldX;
    const markWidth = font.widthOfTextAtSize(CHECKBOX_MARK, MARK_FONT_SIZE);
    const textX = checkboxMarkX + markWidth + spaceBetweenMarkAndText;
    let markY = currentY + lineHeight / 2;

    markY = pageHeight - markY - lineHeight / 2;

    page.drawText(CHECKBOX_MARK, {
      x: checkboxMarkX,
      y: markY,
      size: MARK_FONT_SIZE,
      font,
    });

    page.drawText(value, {
      x: textX,
      y: markY,
      size: MARK_FONT_SIZE,
      font,
    });

    currentY -= lineHeight;
  }
};

const handleMarkField = (
  page: PDFPage,
  fieldX: number,
  fieldY: number,
  fieldWidth: number,
  fieldHeight: number,
  pageHeight: number,
  textWidth: number,
  font: PDFFont,
  mark: string,
) => {
  const textX = fieldX + (fieldWidth - textWidth) / 2;
  let markY = fieldY + fieldHeight / 2;

  markY = pageHeight - markY - MARK_FONT_SIZE / 2;

  page.drawText(mark, {
    x: textX + MARK_FONT_SIZE - MARK_OFFSET,
    y: markY,
    size: MARK_FONT_SIZE,
    font,
  });
};

export const insertFieldInPDF = async (pdf: PDFDocument, field: FieldWithSignature) => {
  const fontCaveat = await fetch(process.env.FONT_CAVEAT_URI).then(async (res) =>
    res.arrayBuffer(),
  );

  const fontNoto = await fetch(process.env.FONT_NOTO_SANS_URI).then(async (res) =>
    res.arrayBuffer(),
  );

  const isSignatureField = isSignatureFieldType(field.type);

  pdf.registerFontkit(fontkit);

  const pages = pdf.getPages();

  const minFontSize = isSignatureField ? MIN_HANDWRITING_FONT_SIZE : MIN_STANDARD_FONT_SIZE;
  const maxFontSize = isSignatureField ? DEFAULT_HANDWRITING_FONT_SIZE : DEFAULT_STANDARD_FONT_SIZE;
  let fontSize = maxFontSize;

  const page = pages.at(field.page - 1);

  if (!page) {
    throw new Error(`Page ${field.page} does not exist`);
  }

  const { width: pageWidth, height: pageHeight } = page.getSize();

  const fieldWidth = pageWidth * (Number(field.width) / 100);
  const fieldHeight = pageHeight * (Number(field.height) / 100);

  const fieldX = pageWidth * (Number(field.positionX) / 100);
  const fieldY = pageHeight * (Number(field.positionY) / 100);

  const font = await pdf.embedFont(isSignatureField ? fontCaveat : fontNoto);

  if (field.type === FieldType.SIGNATURE || field.type === FieldType.FREE_SIGNATURE) {
    await pdf.embedFont(fontCaveat);
  }

  const isInsertingImage =
    isSignatureField && typeof field.Signature?.signatureImageAsBase64 === 'string';

  if (isSignatureField && isInsertingImage) {
    const image = await pdf.embedPng(field.Signature?.signatureImageAsBase64 ?? '');

    let imageWidth = image.width;
    let imageHeight = image.height;

    const scalingFactor = Math.min(fieldWidth / imageWidth, fieldHeight / imageHeight, 1);

    imageWidth = imageWidth * scalingFactor;
    imageHeight = imageHeight * scalingFactor;

    const imageX = fieldX + (fieldWidth - imageWidth) / 2;
    let imageY = fieldY + (fieldHeight - imageHeight) / 2;

    // Invert the Y axis since PDFs use a bottom-left coordinate system
    imageY = pageHeight - imageY - imageHeight;

    page.drawImage(image, {
      x: imageX,
      y: imageY,
      width: imageWidth,
      height: imageHeight,
    });
  } else {
    const longestLineInTextForWidth = field.customText
      .split('\n')
      .sort((a, b) => b.length - a.length)[0];

    let textWidth = font.widthOfTextAtSize(longestLineInTextForWidth, fontSize);
    const textHeight = font.heightAtSize(fontSize);

    const scalingFactor = Math.min(fieldWidth / textWidth, fieldHeight / textHeight, 1);

    fontSize = Math.max(Math.min(fontSize * scalingFactor, maxFontSize), minFontSize);
    textWidth = font.widthOfTextAtSize(longestLineInTextForWidth, fontSize);

    const textX = fieldX + (fieldWidth - textWidth) / 2;
    let textY = fieldY + (fieldHeight - textHeight) / 2;

    // Invert the Y axis since PDFs use a bottom-left coordinate system
    textY = pageHeight - textY - textHeight;

    if (field.type === FieldType.CHECKBOX) {
      const checkboxValues = field.customText.split(',').map((value) => value.trim());
      const formattedCheckboxValues = checkboxValues.map((value) =>
        value.includes('empty-value-') ? '' : value,
      );

      handleCheckboxField(
        page,
        fieldX,
        fieldY,
        fieldWidth,
        fieldHeight,
        pageHeight,
        font,
        formattedCheckboxValues,
      );
    }

    if (field.type === FieldType.RADIO) {
      handleMarkField(
        page,
        fieldX,
        fieldY,
        fieldWidth,
        fieldHeight,
        pageHeight,
        textWidth,
        font,
        RADIO_MARK,
      );
    }

    if (field.type !== 'CHECKBOX') {
      const customText =
        field.type === 'RADIO' && field.customText.includes('empty-value-') ? '' : field.customText;

      page.drawText(customText, {
        x: textX,
        y: textY,
        size: fontSize,
        font,
      });
    }
  }

  return pdf;
};

export const insertFieldInPDFBytes = async (
  pdf: ArrayBuffer | Uint8Array | string,
  field: FieldWithSignature,
) => {
  const pdfDoc = await PDFDocument.load(pdf);

  await insertFieldInPDF(pdfDoc, field);

  return await pdfDoc.save();
};
