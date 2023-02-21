import { z } from 'zod';

import { ISODate } from '../time/Time';
import { DbObject } from '../types/Common';
import { ObjectId } from '../types/Id';
import { MoneyLike } from '../util/Money';
import { Expense } from './Expense';
import { RecurrencePeriod } from './Recurrence';

export const RecurringExpenseTarget = z.enum(['single', 'all', 'after']);
export type RecurringExpenseTarget = z.infer<typeof RecurringExpenseTarget>;

export const RecurringExpenseInput = z.object({
  period: RecurrencePeriod,
  occursUntil: ISODate.optional(),
});
export type RecurringExpenseInput = z.infer<typeof RecurringExpenseInput>;

export const RecurringExpense = RecurringExpenseInput.extend({
  templateExpenseId: ObjectId,
  type: z.literal('recurring'),
  title: z.string(),
  receiver: z.string(),
  sum: MoneyLike,
  categoryId: ObjectId,
  firstOccurence: ISODate,
  recurrencePerYear: MoneyLike,
  recurrencePerMonth: MoneyLike,
  nextMissing: ISODate,
}).and(DbObject);
export type RecurringExpense = z.infer<typeof RecurringExpense>;

export interface Recurrence extends DbObject, RecurringExpenseInput {
  nextMissing: ISODate;
  templateExpenseId: number;
}

export const RecurringExpenseDetails = z.object({
  recurringExpense: RecurringExpense,
  firstOccurence: Expense.optional(),
  lastOccurence: Expense.optional(),
  totalExpenses: z.number(),
  totalSum: MoneyLike,
});
export type RecurringExpenseDetails = z.infer<typeof RecurringExpenseDetails>;
