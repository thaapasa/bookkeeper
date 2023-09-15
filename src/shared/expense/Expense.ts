import { Dayjs } from 'dayjs';
import { z } from 'zod';

import { ISODate } from '../time/Time';
import { DbObject, ShortString } from '../types/Common';
import { ObjectId } from '../types/Id';
import { MoneyLike } from '../util/Money';

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

export const BaseExpenseData = z.object({
  userId: ObjectId,
  categoryId: ObjectId,
  sourceId: ObjectId,
  type: ExpenseType,
  confirmed: z.boolean(),
  title: ShortString,
  receiver: ShortString,
});
export type BaseExpenseData = z.infer<typeof BaseExpenseData>;

export const ExpenseData = BaseExpenseData.extend({
  description: z.string().or(z.null()),
  date: ISODate,
  sum: MoneyLike,
  division: ExpenseDivision.optional(),
});
export type ExpenseData = z.infer<typeof ExpenseData>;

export const Expense = DbObject.merge(ExpenseData).extend({
  groupId: ObjectId,
  created: z.date(),
  createdById: z.number(),
  recurringExpenseId: ObjectId.or(z.null()),
});
export type Expense = z.infer<typeof Expense>;

export const ExpenseInput = ExpenseData.extend({
  confirmed: z.boolean().optional(),
  description: z.union([z.string(), z.null(), z.undefined()]),
});
export type ExpenseInput = z.infer<typeof ExpenseInput>;

export interface ExpenseInputWithDefaults extends ExpenseInput {
  confirmed: boolean;
  description: string | null;
}

export const UserExpense = Expense.extend({
  userBalance: MoneyLike,
  userBenefit: MoneyLike,
  userCost: MoneyLike,
  userIncome: MoneyLike,
  userSplit: MoneyLike,
  userTransferor: MoneyLike,
  userTransferee: MoneyLike,
  userValue: MoneyLike,
});
export type UserExpense = z.infer<typeof UserExpense>;

export interface ExpenseInEditor extends BaseExpenseData {
  subcategoryId: number;
  sum: string;
  date: Dayjs;
  benefit: number[];
  description: string;
}

export interface UserExpenseWithDetails extends UserExpense {
  division: ExpenseDivision;
}

export function isExpense(e: any): e is Expense {
  return (
    e &&
    typeof e === 'object' &&
    typeof e.id === 'number' &&
    typeof e.categoryId === 'number' &&
    typeof e.title === 'string'
  );
}

export const ExpenseStatus = z.object({
  balance: MoneyLike,
  benefit: MoneyLike,
  cost: MoneyLike,
  income: MoneyLike,
  split: MoneyLike,
  transferor: MoneyLike,
  transferee: MoneyLike,
  value: MoneyLike,
});
export type ExpenseStatus = z.infer<typeof ExpenseStatus>;

export const ExpenseCollection = z.object({
  expenses: z.array(UserExpense),
  monthStatus: ExpenseStatus,
  startStatus: ExpenseStatus,
  endStatus: ExpenseStatus,
  unconfirmedBefore: z.boolean(),
});
export type ExpenseCollection = z.infer<typeof ExpenseCollection>;

export const ExpenseQuery = z
  .object({
    search: z.string(),
    receiver: z.string(),
    type: ExpenseType.or(z.array(ExpenseType)).optional(),
    categoryId: ObjectId.or(z.array(ObjectId)),
    startDate: ISODate,
    endDate: ISODate,
    userId: ObjectId,
    includeRecurring: z.boolean(),
    includeSubCategories: z.boolean(),
    confirmed: z.boolean().optional(),
  })
  .partial();

export type ExpenseQuery = z.infer<typeof ExpenseQuery>;
