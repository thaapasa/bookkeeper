import { z } from 'zod';

import { ISODate, toDayjs } from '../time/Time';
import { ObjectId } from '../types/Id';
import { Money, MoneyLike } from '../util/Money';
import { BaseExpenseData, ExpenseInEditor } from './Expense';

export const ExpenseShortcutData = BaseExpenseData.extend({
  title: z.string(),
  subcategoryId: z.number(),
  sum: MoneyLike,
  date: ISODate,
  benefit: z.array(z.number()),
  description: z.string(),
}).partial();

export type ExpenseShortcutData = z.infer<typeof ExpenseShortcutData>;

export interface ExpenseShortcut {
  id: ObjectId;
  title: string;
  icon?: string;
  expense: ExpenseShortcutData;
  background?: string;
  sortOrder: number;
}

export const ExpenseShortcutPayload = z.object({
  title: z.string().trim().nonempty(),
  background: z.string().trim().optional(),
  expense: ExpenseShortcutData,
});
export type ExpenseShortcutPayload = z.infer<typeof ExpenseShortcutPayload>;

export function shortcutToExpenseInEditor(expense: ExpenseShortcutData): Partial<ExpenseInEditor> {
  return {
    ...expense,
    sum: expense.sum ? Money.from(expense.sum).toString() : undefined,
    date: expense.date ? toDayjs(expense.date) : undefined,
  };
}
