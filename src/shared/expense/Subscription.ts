import { z } from 'zod';

import { ExpenseType } from './Expense';
import { RecurringExpense } from './RecurringExpense';
import { ExpenseReport } from './Report';

export const SubscriptionSearchCriteria = z.object({
  type: ExpenseType.or(z.array(ExpenseType)).optional(),
  includeEnded: z.boolean().optional(),
  onlyOwn: z.boolean().optional(),
});
export type SubscriptionSearchCriteria = z.infer<
  typeof SubscriptionSearchCriteria
>;

export const SubscriptionResult = z.object({
  recurringExpenses: z.array(RecurringExpense),
  reports: z.array(ExpenseReport),
});
export type SubscriptionResult = z.infer<typeof SubscriptionResult>;
