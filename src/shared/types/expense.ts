import { DbObject } from './common';
import { MoneyLike } from '../util/money';

export type ExpenseType = 'expense' | 'income';
export type ExpenseDivisionType = 'cost' | 'benefit' | 'income' | 'split';

export interface UserExpense extends Expense {
    userBalance: MoneyLike;
    userBenefit: MoneyLike;
    userCost: MoneyLike;
    userIncome: MoneyLike;
    userSplit: MoneyLike;
    userValue: MoneyLike;
}

export interface ExpenseDivisionItem {
    userId: number;
    type: ExpenseDivisionType;
    sum: MoneyLike;
}

export type ExpenseDivision = ExpenseDivisionItem[];

export interface Expense extends DbObject {
    categoryId: number;
    confirmed: boolean;
    created: Date;
    createdById: number;
    date: string;
    description: string | null;
    groupId: number;
    receiver: string;
    recurringExpenseId: number | null;
    sourceId: number;
    sum: MoneyLike;
    title: string;
    type: ExpenseType;
    template: boolean;
    userId: number;
    division?: ExpenseDivision;
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
    nextMissing: string;
    templateExpenseId: number;
}
