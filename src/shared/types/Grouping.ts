import { z } from 'zod';

import { UserExpense } from '../expense/Expense';
import { ISODate } from '../time/Time';
import { MoneyLike } from '../util/Money';
import { ObjectId } from './Id';

export const ExpenseGroupingData = z.object({
  title: z.string(),
  color: z.string(),
  tags: z.array(z.string()),
  private: z.boolean(),
  onlyOwn: z.boolean(),
  startDate: ISODate.optional(),
  endDate: ISODate.optional(),
  categories: z.array(ObjectId),
});
export type ExpenseGroupingData = z.infer<typeof ExpenseGroupingData>;

export const ExpenseGrouping = ExpenseGroupingData.extend({
  id: ObjectId,
  image: z.string().min(5).optional(),
  totalSum: MoneyLike,
});
export type ExpenseGrouping = z.infer<typeof ExpenseGrouping>;

export const ExpenseGroupingCategoryTotal = z.object({
  categoryId: ObjectId,
  title: z.string(),
  sum: MoneyLike,
});
export type ExpenseGroupingCategoryTotal = z.infer<typeof ExpenseGroupingCategoryTotal>;

export const ExpenseGroupingRef = ExpenseGrouping.pick({
  id: true,
  title: true,
  image: true,
  color: true,
  tags: true,
  private: true,
  onlyOwn: true,
});
export type ExpenseGroupingRef = z.infer<typeof ExpenseGroupingRef>;

export const ExpenseGroupingWithExpenses = ExpenseGrouping.extend({
  expenses: z.array(UserExpense),
  categoryTotals: z.array(ExpenseGroupingCategoryTotal),
});
export type ExpenseGroupingWithExpenses = z.infer<typeof ExpenseGroupingWithExpenses>;
