import { UserExpense } from 'shared/expense';
import { Money } from 'shared/util';

export type ExpenseFilterFunction = (expense: UserExpense) => boolean;

export interface ExpenseFilter {
  filter: ExpenseFilterFunction;
  name: string;
  avatar?: string;
}

export const ExpenseFilters = {
  unconfirmed: e => !e.confirmed,
  zeroBalance: e => Money.zero.equals(e.userBalance),
  nonZeroBalance: e => !Money.zero.equals(e.userBalance),
} satisfies Record<string, ExpenseFilterFunction>;
