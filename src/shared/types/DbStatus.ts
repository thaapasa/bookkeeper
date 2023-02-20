import { ExpenseType } from '../expense/Expense';
import { MoneyLike } from '../util/Money';

export interface TypeStatus {
  type: ExpenseType;
  count: number;
  sum: MoneyLike;
}

export interface ZeroSumData {
  id: number;
  zerosum: number;
}

export interface InvalidDivision {
  id: number;
  type: ExpenseType;
  sum: MoneyLike;
  positive: MoneyLike;
  negative: MoneyLike;
  zero: MoneyLike;
}

export interface DbStatus {
  status: TypeStatus[];
  invalidZerosum: ZeroSumData[];
  invalidDivision: InvalidDivision[];
}
