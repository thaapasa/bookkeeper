import { z } from 'zod';

import { MoneyLike } from 'shared/util/Money';
import { ISODate } from 'shared/util/Time';

import { DbObject } from './Common';
import { BooleanString, IntArrayString, IntString } from './Validator';

export const ExpenseType = z.enum(['expense', 'income', 'transfer']);
export type ExpenseType = z.infer<typeof ExpenseType>;

export const ExpenseDivisionType = z.enum([
  'cost',
  'benefit',
  'income',
  'split',
  'transferor',
  'transferee',
]);
export type ExpenseDivisionType = z.infer<typeof ExpenseDivisionType>;

export const expenseTypes = ExpenseType.options;

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

export const expenseBeneficiary: Record<ExpenseType, ExpenseDivisionType> = {
  expense: 'benefit',
  income: 'split',
  transfer: 'transferee',
};

export const expensePayer: Record<ExpenseType, ExpenseDivisionType> = {
  expense: 'cost',
  income: 'income',
  transfer: 'transferor',
};

export const ExpenseDivisionItem = z.object({
  userId: z.number(),
  type: ExpenseDivisionType,
  sum: MoneyLike,
});
export type ExpenseDivisionItem = z.infer<typeof ExpenseDivisionItem>;

export const ExpenseDivision = z.array(ExpenseDivisionItem);
export type ExpenseDivision = z.infer<typeof ExpenseDivision>;

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

export const RecurringExpensePeriod = z.enum(['monthly', 'yearly']);
export type RecurringExpensePeriod = z.infer<typeof RecurringExpensePeriod>;

export const RecurringExpenseTarget = z.enum(['single', 'all', 'after']);
export type RecurringExpenseTarget = z.infer<typeof RecurringExpenseTarget>;

export const RecurringExpenseInput = z.object({
  period: RecurringExpensePeriod,
  occursUntil: ISODate.optional(),
});
export type RecurringExpenseInput = z.infer<typeof RecurringExpenseInput>;

export interface Recurrence extends DbObject, RecurringExpenseInput {
  nextMissing: ISODate;
  templateExpenseId: number;
}

export const ExpenseQuery = z
  .object({
    search: z.string(),
    receiver: z.string(),
    categoryId: IntString.or(IntArrayString),
    startDate: ISODate,
    endDate: ISODate,
    userId: IntString,
    includeSubCategories: BooleanString,
  })
  .partial();

export type ExpenseQuery = z.infer<typeof ExpenseQuery>;
