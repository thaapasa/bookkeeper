import { z } from 'zod';

import { UserExpense } from '../expense/Expense';
import { ISODate } from '../time/Time';
import { ObjectId } from './Id';

export const ExpenseGroupingData = z.object({
  title: z.string(),
  startDate: ISODate.optional(),
  endDate: ISODate.optional(),
  categories: z.array(ObjectId),
});
export type ExpenseGroupingData = z.infer<typeof ExpenseGroupingData>;

export const ExpenseGrouping = ExpenseGroupingData.extend({
  id: ObjectId,
  image: z.string().min(5).optional(),
});
export type ExpenseGrouping = z.infer<typeof ExpenseGrouping>;

export const ExpenseGroupingRef = ExpenseGrouping.pick({ id: true, title: true, image: true });
export type ExpenseGroupingRef = z.infer<typeof ExpenseGroupingRef>;

export const ExpenseGroupingWithExpenses = ExpenseGrouping.extend({
  expenses: z.array(UserExpense),
});
export type ExpenseGroupingWithExpenses = z.infer<typeof ExpenseGroupingWithExpenses>;
