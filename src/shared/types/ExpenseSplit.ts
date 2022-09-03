import { z } from 'zod';

import { MoneyLikeZ } from 'shared/util/Money';

import { ExpenseDivision } from './Expense';

export const ExpenseSplit = z.object({
  categoryId: z.number(),
  sourceId: z.number(),
  title: z.string(),
  sum: MoneyLikeZ,
  division: ExpenseDivision,
});
export type ExpenseSplit = z.infer<typeof ExpenseSplit>;
