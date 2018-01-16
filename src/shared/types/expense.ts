import { DbObject } from "./common";
import Money from "../util/money";

export type ExpenseType = 'expense' | 'income';
export type ExpenseDivisionType = 'cost' | 'benefit' | 'income' | 'split';

export interface UserExpense extends Expense {
    userBalance: string;
    userBenefit: string;
    userCost: string;
    userIncome: string;
    userSplit: string;
    userValue: string;
}

export interface ExpenseDivisionItem {
    userId: number;
    type: ExpenseDivisionType;
    sum: Money;
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
    sum: Money;
    title: string;
    type: ExpenseType;
    template: boolean;
    userId: number;
    division?: ExpenseDivision;
}

export type RecurringExpensePeriod = 'monthly' | 'yearly';
