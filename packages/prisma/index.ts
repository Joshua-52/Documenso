import { PrismaClient } from '@prisma/client';
import {
  completedDocumentsMonthly,
  signerConversionMonthly,
  userMonthlyGrowth,
  userWithSignedDocumentMonthlyGrowth,
} from '@prisma/client/sql';
import { Kysely, PostgresAdapter, PostgresIntrospector, PostgresQueryCompiler } from 'kysely';
import kyselyExtension from 'prisma-extension-kysely';

import type { DB } from './generated/types';
import { getDatabaseUrl } from './helper';
import { remember } from './utils/remember';

export const prisma = remember(
  'prisma',
  () =>
    new PrismaClient({
      datasourceUrl: getDatabaseUrl(),
    }),
);

export const SQL = {
  completedDocumentsMonthly,
  signerConversionMonthly,
  userMonthlyGrowth,
  userWithSignedDocumentMonthlyGrowth,
};

export const kyselyPrisma = remember('kyselyPrisma', () =>
  prisma.$extends(
    kyselyExtension({
      kysely: (driver) =>
        new Kysely<DB>({
          dialect: {
            createAdapter: () => new PostgresAdapter(),
            createDriver: () => driver,
            createIntrospector: (db) => new PostgresIntrospector(db),
            createQueryCompiler: () => new PostgresQueryCompiler(),
          },
        }),
    }),
  ),
);

export { sql } from 'kysely';
