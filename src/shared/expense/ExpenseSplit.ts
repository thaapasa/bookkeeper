import { z } from 'zod';

import { ShortString } from '../types/Common';
import { ObjectId } from '../types/Id';
import { MoneyLike } from '../util/Money';
import { ExpenseDivision } from './Expense';

export const ExpenseSplit = z.object({
  categoryId: ObjectId,
  sourceId: ObjectId,
  title: ShortString,
  sum: MoneyLike,
  division: ExpenseDivision,
});
export type ExpenseSplit = z.infer<typeof ExpenseSplit>;
