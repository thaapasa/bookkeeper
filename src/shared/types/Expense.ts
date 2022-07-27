import * as t from 'io-ts';

import { MoneyLike } from 'shared/util/Money';
import { ISODate, TISODate } from 'shared/util/Time';

import { DbObject } from './Common';
import { BooleanString, IntArrayString, IntString } from './Validator';

export type ExpenseType = 'expense' | 'income' | 'transfer';
export type ExpenseDivisionType =
  | 'cost'
  | 'benefit'
  | 'income'
  | 'split'
  | 'transferor'
  | 'transferee';

export const expenseTypes: ExpenseType[] = ['expense', 'income', 'transfer'];

export function getExpenseTypeLabel(type: ExpenseType): string {
  switch (type) {
    case 'income':
      return 'Tulo';
    case 'expense':
      return 'Kulu';
    case 'transfer':
      return 'Siirto';
    default:
      return '?';
  }
}

export const expenseBeneficiary: Record<string, ExpenseDivisionType> = {
  expense: 'benefit',
  income: 'split',
  transfer: 'transferee',
};

export const expensePayer: Record<string, ExpenseDivisionType> = {
  expense: 'cost',
  income: 'income',
  transfer: 'transferor',
};

export interface ExpenseDivisionItem {
  userId: number;
  type: ExpenseDivisionType;
  sum: MoneyLike;
}

export type ExpenseDivision = ExpenseDivisionItem[];

export interface BaseExpenseData {
  userId: number;
  categoryId: number;
  sourceId: number;
  type: ExpenseType;
  confirmed: boolean;
  title: string;
  receiver: string;
}

export interface ExpenseData extends BaseExpenseData {
  description: string | null;
  date: ISODate;
  sum: MoneyLike;
  division?: ExpenseDivision;
}

export interface Expense extends DbObject, ExpenseData {
  groupId: number;
  created: Date;
  createdById: number;
  recurringExpenseId: number | null;
  template: boolean;
}

export interface UserExpense extends Expense {
  userBalance: MoneyLike;
  userBenefit: MoneyLike;
  userCost: MoneyLike;
  userIncome: MoneyLike;
  userSplit: MoneyLike;
  userTransferor: MoneyLike;
  userTransferee: MoneyLike;
  userValue: MoneyLike;
}

export interface ExpenseInEditor extends BaseExpenseData {
  subcategoryId: number;
  sum: string;
  date: Date;
  benefit: number[];
  description: string;
}

export interface UserExpenseWithDetails extends UserExpense {
  division: ExpenseDivision;
}

export function isExpense(e: any): e is Expense {
  return (
    typeof e === 'object' &&
    typeof e.id === 'number' &&
    typeof e.categoryId === 'number' &&
    typeof e.title === 'string' &&
    typeof e.template === 'boolean'
  );
}

export interface ExpenseStatus {
  balance: MoneyLike;
  benefit: MoneyLike;
  cost: MoneyLike;
  income: MoneyLike;
  split: MoneyLike;
  transferor: MoneyLike;
  transferee: MoneyLike;
  value: MoneyLike;
}

export interface ExpenseCollection {
  expenses: UserExpense[];
  monthStatus: ExpenseStatus;
  startStatus: ExpenseStatus;
  endStatus: ExpenseStatus;
  unconfirmedBefore: boolean;
}

export const RecurringExpensePeriod = t.keyof({ monthly: null, yearly: null });
export type RecurringExpensePeriod = t.TypeOf<typeof RecurringExpensePeriod>;

export const RecurringExpenseTarget = t.keyof({
  single: null,
  all: null,
  after: null,
});
export type RecurringExpenseTarget = t.TypeOf<typeof RecurringExpenseTarget>;

export const RecurringExpenseInput = t.intersection([
  t.type({ period: RecurringExpensePeriod }),
  t.partial({ occursUntil: TISODate }),
]);
export type RecurringExpenseInput = t.TypeOf<typeof RecurringExpenseInput>;

export interface Recurrence extends DbObject, RecurringExpenseInput {
  nextMissing: ISODate;
  templateExpenseId: number;
}

export const ExpenseQuery = t.partial({
  search: t.string,
  receiver: t.string,
  categoryId: t.union([IntString, IntArrayString]),
  startDate: TISODate,
  endDate: TISODate,
  userId: IntString,
  includeSubCategories: BooleanString,
});
export type ExpenseQuery = t.TypeOf<typeof ExpenseQuery>;
