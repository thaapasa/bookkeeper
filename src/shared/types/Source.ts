import { z } from 'zod';

import { DbObject, ShortString } from './Common';
import { ObjectId } from './Id';

export const UserShare = z.object({
  userId: ObjectId,
  share: z.number(),
});
export type UserShare = z.infer<typeof UserShare>;

/**
 * Bank statement CSV format of the bank account behind a source, when it has
 * one. See docs/BANK_STATEMENTS.md.
 */
export const StatementFormat = z.enum(['op', 'spankki']);
export type StatementFormat = z.infer<typeof StatementFormat>;

export const Source = DbObject.extend({
  name: ShortString,
  abbreviation: z.string().or(z.null()),
  shares: z.number(),
  users: z.array(UserShare),
  image: z.string().optional(),
  statementFormat: StatementFormat.nullable(),
});
export type Source = z.infer<typeof Source>;

export const SourcePatch = Source.pick({ name: true, statementFormat: true }).partial();
export type SourcePatch = z.infer<typeof SourcePatch>;
