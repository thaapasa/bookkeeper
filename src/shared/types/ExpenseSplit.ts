import * as io from 'io-ts';

import { MoneyLike } from 'shared/util/Money';

import { NonEmptyArray } from './Validator';

export const ExpenseSplit = io.type(
  {
    categoryId: io.number,
    sourceId: io.number,
    title: io.string,
    sum: MoneyLike,
    key: io.string,
    benefit: NonEmptyArray(io.number),
  },
  'ExpenseSplit'
);
export type ExpenseSplit = io.TypeOf<typeof ExpenseSplit>;
