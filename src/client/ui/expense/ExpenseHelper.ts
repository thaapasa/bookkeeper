import Money, { MoneyLike } from '../../../shared/util/Money';
import { Expense, ExpenseStatus, UserExpense } from '../../../shared/types/Expense';

export function expenseName(e: Expense): string {
  return `${e.title} (${e.receiver}): ${Money.from(e.sum).format()}`;
}

export function money(v?: MoneyLike): string {
  return v ? Money.from(v).format() : '-';
}

export interface ExpenseTotals {
  totalExpense: MoneyLike;
  totalIncome: MoneyLike;
}

export type ExpenseFilterFunction = (expense: UserExpense) => boolean;

export interface ExpenseFilter {
  filter: ExpenseFilterFunction;
  name: string;
  avatar?: string;
}

export const zeroStatus: ExpenseStatus = {
  balance: 0,
  benefit: 0,
  cost: 0,
  income: 0,
  split: 0,
  value: 0,
};
