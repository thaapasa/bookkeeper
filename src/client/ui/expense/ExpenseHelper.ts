import { ExpenseData, ExpenseStatus } from 'shared/expense/Expense';
import Money, { MoneyLike } from 'shared/util/Money';

export function expenseName(e: ExpenseData): string {
  return `${e.title} (${e.receiver}): ${Money.from(e.sum).format()}`;
}

export function money(v?: MoneyLike): string {
  return v ? Money.from(v).format() : '-';
}

export interface ExpenseTotals {
  totalExpense: MoneyLike;
  totalIncome: MoneyLike;
}

export const zeroStatus: ExpenseStatus = {
  balance: 0,
  benefit: 0,
  cost: 0,
  income: 0,
  split: 0,
  transferor: 0,
  transferee: 0,
  value: 0,
};
