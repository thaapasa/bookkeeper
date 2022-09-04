import { z } from 'zod';

import { MoneyLike } from 'shared/util/Money';

import { ShortString } from './Common';
import { ExpenseDivision } from './Expense';
import { ObjectId } from './Id';

export const ExpenseSplit = z.object({
  categoryId: ObjectId,
  sourceId: ObjectId,
  title: ShortString,
  sum: MoneyLike,
  division: ExpenseDivision,
});
export type ExpenseSplit = z.infer<typeof ExpenseSplit>;
