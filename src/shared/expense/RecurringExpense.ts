import { z } from 'zod';

import { ISODate } from '../time/Time';
import { DbObject } from '../types/Common';
import { RecurrencePeriod } from './Recurrence';

export const RecurringExpenseTarget = z.enum(['single', 'all', 'after']);
export type RecurringExpenseTarget = z.infer<typeof RecurringExpenseTarget>;

export const RecurringExpenseInput = z.object({
  period: RecurrencePeriod,
  occursUntil: ISODate.optional(),
});
export type RecurringExpenseInput = z.infer<typeof RecurringExpenseInput>;

/**
 * Internal "recurrence in DB" shape used by the auto-generation loop.
 * Not part of any API surface.
 */
export interface Recurrence extends DbObject, RecurringExpenseInput {
  nextMissing: ISODate;
}
