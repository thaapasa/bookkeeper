import { z } from 'zod';

import { ISODate, ISOTimestamp } from '../time/Time';
import { DbObject, ShortString } from '../types/Common';
import { ObjectId } from '../types/Id';
import { Money, MoneyLike } from '../util/Money';

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

/**
 * `sum` is always in EUR and is the single source of truth for all division and
 * balance math. `currencyId` + `originalCurrencyValue` are an optional, purely
 * informative annotation recording what the expense originally cost abroad; they
 * are always set together or not at all (enforced by a DB CHECK, and by
 * `ExpenseInputBody` in the API layer).
 *
 * Note: do not `.refine()` this schema — `Expense` merges it and `ExpenseInput`
 * extends it, and neither operation exists on the ZodEffects `.refine()` returns.
 */
export const ExpenseData = BaseExpenseData.extend({
  description: z.string().or(z.null()),
  date: ISODate,
  sum: MoneyLike,
  division: ExpenseDivision.optional(),
  groupingId: ObjectId.optional(),
  currencyId: ObjectId.nullable().optional(),
  originalCurrencyValue: MoneyLike.nullable().optional(),
});
export type ExpenseData = z.infer<typeof ExpenseData>;

export const Expense = DbObject.merge(ExpenseData).extend({
  groupId: ObjectId,
  created: ISOTimestamp,
  updated: ISOTimestamp,
  createdById: z.number(),
  subscriptionId: ObjectId.or(z.null()),
  /**
   * Opaque group key (UUID) shared by expenses split from the same original
   * expense, or linked together manually. Purely informative: it is not a
   * reference to any row, and it is always set server-side — client input
   * schemas (`ExpenseInput`) deliberately exclude it.
   */
  splitId: z.uuid().or(z.null()),
});
export type Expense = z.infer<typeof Expense>;

export const ExpenseInput = ExpenseData.extend({
  confirmed: z.boolean().optional(),
  description: z.string().nullable().optional(),
});
export type ExpenseInput = z.infer<typeof ExpenseInput>;

export interface ExpenseInputWithDefaults extends ExpenseInput {
  confirmed: boolean;
  description: string | null;
}

export const UserExpense = Expense.extend({
  autoGroupingIds: z.array(ObjectId),
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
  sum: string;
  date: ISODate;
  benefit: number[];
  description: string;
  groupingId: number | null;
  /** Null when the expense is in EUR; otherwise the foreign currency it was paid in */
  currencyId: number | null;
  /** The amount in `currencyId`; empty string when the expense is in EUR */
  originalCurrencyValue: string;
}

export interface UserExpenseWithDetails extends UserExpense {
  division: ExpenseDivision;
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
    title: z.string(),
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

export type ExpenseTotals<M extends MoneyLike = MoneyLike> = Record<ExpenseType, M> & { total: M };

export function calculateTotals(expenses: Expense[]): ExpenseTotals<Money> {
  const result: ExpenseTotals<Money> = {
    income: Money.from(0),
    expense: Money.from(0),
    transfer: Money.from(0),
    total: Money.from(0),
  };
  expenses.forEach(e => (result[e.type] = result[e.type].plus(e.sum)));
  result.total = result.expense.minus(result.income);
  return result;
}
