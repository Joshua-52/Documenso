import { z } from 'zod';

export const ZCurrentPasswordSchema = z
  .string()
  .min(6, { message: 'Must be at least 6 characters in length' })
  .max(72);

export const ZHintedPasswordSchema = z
  .string()
  .regex(new RegExp('.*[A-Z].*'))
  .regex(new RegExp('.*[a-z].*'))
  .regex(new RegExp('.*\\d.*'))
  .regex(new RegExp('.*[`~<>?,./!@#$%^&*()\\-_+="\'|{}\\[\\];:\\\\].*'), {
    message: 'One special character is required',
  })
  .min(8)
  .max(72);

export const ZPasswordSchema = z
  .string()
  .regex(new RegExp('.*[A-Z].*'), { message: 'One uppercase character' })
  .regex(new RegExp('.*[a-z].*'), { message: 'One lowercase character' })
  .regex(new RegExp('.*\\d.*'), { message: 'One number' })
  .regex(new RegExp('.*[`~<>?,./!@#$%^&*()\\-_+="\'|{}\\[\\];:\\\\].*'), {
    message: 'One special character is required',
  })
  .min(8, { message: 'Must be at least 8 characters in length' })
  .max(72, { message: 'Cannot be more than 72 characters in length' });

export const ZSignUpMutationSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: ZPasswordSchema,
  signature: z.string().min(1, { message: 'A signature is required.' }),
});

export type TSignUpMutationSchema = z.infer<typeof ZSignUpMutationSchema>;

export const ZVerifyPasswordMutationSchema = ZSignUpMutationSchema.pick({ password: true });
