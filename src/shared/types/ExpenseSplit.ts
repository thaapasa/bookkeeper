import * as io from 'io-ts';

import { MoneyLike } from 'shared/util/Money';

import { ExpenseDivision } from './Expense';

export const ExpenseSplit = io.type(
  {
    categoryId: io.number,
    sourceId: io.number,
    title: io.string,
    sum: MoneyLike,
    division: ExpenseDivision,
  },
  'ExpenseSplit'
);
export type ExpenseSplit = io.TypeOf<typeof ExpenseSplit>;
