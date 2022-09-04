import { z } from 'zod';

import { MoneyLike } from 'shared/util/Money';

import { ExpenseDivision } from './Expense';

export const ExpenseSplit = z.object({
  categoryId: z.number(),
  sourceId: z.number(),
  title: z.string(),
  sum: MoneyLike,
  division: ExpenseDivision,
});
export type ExpenseSplit = z.infer<typeof ExpenseSplit>;
