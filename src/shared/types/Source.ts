import { z } from 'zod';

import { DbObject, ShortString } from './Common';
import { ObjectId } from './Id';

/** Last 4 digits of a bank card number, as text to preserve leading zeros. */
export const CardLastDigits = z.string().regex(/^\d{4}$/);
export type CardLastDigits = z.infer<typeof CardLastDigits>;

export const UserShare = z.object({
  userId: ObjectId,
  share: z.number(),
  /**
   * Cards attached to this source for this user, as last-4-digit strings.
   * Array order is the display order in the formatted source name.
   */
  cards: z.array(CardLastDigits),
});
export type UserShare = z.infer<typeof UserShare>;

export const SourceUserCardsUpdate = z.object({ cards: z.array(CardLastDigits) });
export type SourceUserCardsUpdate = z.infer<typeof SourceUserCardsUpdate>;

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
