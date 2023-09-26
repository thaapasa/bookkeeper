import { z } from 'zod';

import { ISODate } from '../time/Time';
import { ObjectId } from '../types/Id';
import { MoneyLike } from '../util/Money';
import { BaseExpenseData } from './Expense';

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
}

export const ExpenseShortcutPayload = z.object({
  title: z.string().trim().nonempty(),
  background: z.string().trim().optional(),
  expense: ExpenseShortcutData,
});
export type ExpenseShortcutPayload = z.infer<typeof ExpenseShortcutPayload>;
