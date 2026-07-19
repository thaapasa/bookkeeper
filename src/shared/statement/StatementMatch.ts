import { z } from 'zod';

import { ExpenseType } from '../expense/Expense';
import { ISODate } from '../time/Time';
import { ObjectId } from '../types/Id';
import { StatementAmount, StatementRow } from './Statement';

/** An expense as shown in the statement matching view. */
export const MatchableExpense = z.object({
  id: ObjectId,
  date: ISODate,
  /** Unsigned expense sum, e.g. "12.90". */
  sum: StatementAmount,
  type: ExpenseType,
  /** Split lineage key: parts of one split purchase share this (see docs/SPLIT_EXPENSES.md). */
  splitId: z.uuid().nullable(),
  /** Non-null for expenses generated from a recurring subscription. */
  subscriptionId: ObjectId.nullable(),
  /** False for preliminary ("Alustava") expenses whose sum may not be final. */
  confirmed: z.boolean(),
  title: z.string().nullable(),
  receiver: z.string().nullable(),
  userId: ObjectId,
  statementSkip: z.boolean(),
  /** The statement rows this expense is matched to (an expense can be paid with several bank payments). */
  matchedStatementRowIds: z.array(ObjectId),
});
export type MatchableExpense = z.infer<typeof MatchableExpense>;

export const MatchingStatementRow = StatementRow.extend({
  matchedExpenseIds: z.array(ObjectId),
});
export type MatchingStatementRow = z.infer<typeof MatchingStatementRow>;

/** Both sides of the matching view for one (source, month). */
export const StatementMatchingData = z.object({
  expenses: z.array(MatchableExpense),
  statementRows: z.array(MatchingStatementRow),
});
export type StatementMatchingData = z.infer<typeof StatementMatchingData>;

/**
 * A matching request: every listed statement row is linked to every listed
 * expense (pairwise cross product). Suggestions always carry a single row;
 * manual matching may group several rows and expenses.
 */
export const StatementMatchInput = z.object({
  statementRowIds: z.array(ObjectId).min(1),
  expenseIds: z.array(ObjectId).min(1),
});
export type StatementMatchInput = z.infer<typeof StatementMatchInput>;

export const StatementMatchBulkInput = z.object({
  matches: z.array(StatementMatchInput).min(1),
});
export type StatementMatchBulkInput = z.infer<typeof StatementMatchBulkInput>;

export const SkipInput = z.object({
  skipped: z.boolean(),
});
export type SkipInput = z.infer<typeof SkipInput>;

/** How many days outside the selected month statement rows are shown. */
export const STATEMENT_MATCH_DATE_TOLERANCE_DAYS = 4;
