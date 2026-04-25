import { z } from 'zod';

import { RecurrenceInterval } from '../time/RecurrenceInterval';
import { ObjectId } from '../types/Id';
import { MoneyLike } from '../util/Money';
import { ExpenseDivision, ExpenseType } from './Expense';
import { RecurringExpense } from './RecurringExpense';
import { ExpenseReport } from './Report';

export const SubscriptionSearchCriteria = z.object({
  type: ExpenseType.or(z.array(ExpenseType)).optional(),
  includeEnded: z.boolean().optional(),
  onlyOwn: z.boolean().optional(),
  range: RecurrenceInterval.optional(),
});
export type SubscriptionSearchCriteria = z.infer<typeof SubscriptionSearchCriteria>;

export const SubscriptionResult = z.object({
  recurringExpenses: z.array(RecurringExpense),
  reports: z.array(ExpenseReport),
});
export type SubscriptionResult = z.infer<typeof SubscriptionResult>;

export const ExpenseDefaults = z.object({
  title: z.string(),
  receiver: z.string().optional(),
  sum: MoneyLike,
  type: ExpenseType,
  sourceId: ObjectId,
  categoryId: ObjectId,
  userId: ObjectId,
  confirmed: z.boolean(),
  description: z.string().or(z.null()),
  division: ExpenseDivision.optional(),
});
export type ExpenseDefaults = z.infer<typeof ExpenseDefaults>;
