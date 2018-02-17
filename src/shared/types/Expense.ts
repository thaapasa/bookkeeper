import { DbObject } from './Common';
import { MoneyLike } from '../util/Money';

export type ExpenseType = 'expense' | 'income';
export type ExpenseDivisionType = 'cost' | 'benefit' | 'income' | 'split';

export interface ExpenseDivisionItem {
  userId: number;
  type: ExpenseDivisionType;
  sum: MoneyLike;
}

export type ExpenseDivision = ExpenseDivisionItem[];

export interface ExpenseData {
  categoryId: number;
  confirmed: boolean;
  description: string | null;
  date: string;
  receiver: string;
  sourceId: number;
  sum: MoneyLike;
  title: string;
  type: ExpenseType;
  userId: number;
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
  userValue: MoneyLike;
}

export interface ExpenseInEditor {
  title: string;
  sourceId: number;
  categoryId: number;
  subcategoryId: number;
  receiver: string;
  sum: string;
  userId: number;
  date: Date;
  benefit: number[];
  description: string;
  confirmed: boolean;
  type: ExpenseType;
}

export interface UserExpenseWithDetails extends UserExpense {
  division: ExpenseDivision;
}

export function isExpense(e: any): e is Expense {
  return typeof e === 'object' && typeof e.id === 'number' && typeof e.categoryId === 'number' && typeof e.title === 'string' && typeof e.template === 'boolean';
}

export interface ExpenseStatus {
  balance: MoneyLike;
  benefit: MoneyLike;
  cost: MoneyLike;
  income: MoneyLike;
  split: MoneyLike;
  value: MoneyLike;
}

export interface ExpenseCollection {
  expenses: UserExpense[];
  monthStatus: ExpenseStatus;
  startStatus: ExpenseStatus;
  endStatus: ExpenseStatus;
  unconfirmedBefore: boolean;
}

export type RecurringExpensePeriod = 'monthly' | 'yearly';

export interface Recurrence extends DbObject {
  period: RecurringExpensePeriod;
  occursUntil?: string;
  nextMissing: string;
  templateExpenseId: number;
}

export type RecurringExpenseTarget = 'single' | 'all' | 'after';
