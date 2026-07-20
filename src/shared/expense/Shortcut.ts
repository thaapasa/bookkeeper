import { z } from 'zod';

import { ISODate } from '../time/Time';
import { ObjectId } from '../types/Id';
import { Money, MoneyLike } from '../util/Money';
import { BaseExpenseData, ExpenseInEditor } from './Expense';

export const ExpenseShortcutData = BaseExpenseData.extend({
  title: z.string(),
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
  /** Statement counterparty patterns, see matchesStatementCounterparty(). */
  statementTargets: string[];
}

export const ExpenseShortcutPayload = z.object({
  title: z.string().trim().min(1),
  background: z.string().trim().optional(),
  expense: ExpenseShortcutData,
  statementTargets: z.array(z.string().trim().min(1)).default([]),
});
export type ExpenseShortcutPayload = z.infer<typeof ExpenseShortcutPayload>;

/**
 * Does a statement row's counterparty match one of the shortcut's statement
 * targets? Case-insensitive substring match, because bank counterparties
 * carry per-purchase suffixes ("Amazon.de*FX9W74Q55"). Whitespace runs are
 * collapsed on both sides, because counterparties can contain long space
 * padding ("EasyPark Oy         easypark.fi") that is impractical to
 * reproduce in a target.
 */
export function matchesStatementCounterparty(
  shortcut: ExpenseShortcut,
  counterparty: string | null,
): boolean {
  if (!counterparty) {
    return false;
  }
  const cp = normalizeForMatch(counterparty);
  return shortcut.statementTargets.some(t => cp.includes(normalizeForMatch(t)));
}

function normalizeForMatch(value: string): string {
  return value.toLowerCase().replace(/\s+/g, ' ').trim();
}

export function shortcutToExpenseInEditor(expense: ExpenseShortcutData): Partial<ExpenseInEditor> {
  return {
    ...expense,
    sum: expense.sum ? Money.from(expense.sum).toString() : undefined,
    date: expense.date,
  };
}
