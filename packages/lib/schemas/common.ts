import { z } from 'zod';

import { URL_REGEX } from '../constants/url-regex';

export const ZUrlSchema = z
  .string()
  .refine((value) => value === undefined || value === '' || URL_REGEX.test(value), {
    message: 'Please enter a valid URL',
  });
