import { z } from 'zod';

import { RecurrenceInterval } from '../time/RecurrenceInterval';
import { ISODate } from '../time/Time';
import { ObjectId } from '../types/Id';
import { MoneyLike } from '../util/Money';
import { ExpenseDivision, ExpenseQuery, ExpenseType } from './Expense';
import { RecurrencePeriod } from './Recurrence';

export const SubscriptionSearchCriteria = z.object({
  type: ExpenseType.or(z.array(ExpenseType)).optional(),
  includeEnded: z.boolean().optional(),
  onlyOwn: z.boolean().optional(),
  range: RecurrenceInterval.optional(),
});
export type SubscriptionSearchCriteria = z.infer<typeof SubscriptionSearchCriteria>;

/**
 * The kind of subscription. While reports and recurring expenses live
 * in separate tables (steps 3-5 of the rework), `kind` is needed to
 * resolve `rowId` to the right table and to attach recurring-only UI
 * affordances (next-missing date, edit template). After step 6b the
 * tables merge and `kind` becomes a UI hint derived from `recurrence`.
 */
export const SubscriptionKind = z.enum(['recurring', 'report']);
export type SubscriptionKind = z.infer<typeof SubscriptionKind>;

export const ExpenseDefaults = z.object({
  title: z.string(),
  receiver: z.string().optional(),
  sum: MoneyLike,
  type: ExpenseType,
  sourceId: ObjectId,
  categoryId: ObjectId,
  userId: ObjectId,
  confirmed: z.boolean(),
  description: z.string().or(z.null()),
  division: ExpenseDivision.optional(),
});
export type ExpenseDefaults = z.infer<typeof ExpenseDefaults>;

/**
 * One subscription card. A recurring row produces exactly one card; a
 * report row produces one card per category that its assigned rows
 * span. `id` is unique across all cards in a result; `rowId` + `kind`
 * point at the underlying DB row for edit/delete operations.
 */
export const Subscription = z.object({
  id: z.string(),
  kind: SubscriptionKind,
  rowId: ObjectId,
  title: z.string(),
  categoryId: ObjectId,
  filter: ExpenseQuery,
  recurrence: RecurrencePeriod.optional(),
  defaults: ExpenseDefaults.optional(),
  nextMissing: ISODate.optional(),
  occursUntil: ISODate.optional(),
  matchedCount: z.number().int(),
  matchedSum: MoneyLike,
  firstDate: ISODate.optional(),
  lastDate: ISODate.optional(),
  recurrencePerMonth: MoneyLike,
  recurrencePerYear: MoneyLike,
});
export type Subscription = z.infer<typeof Subscription>;

export const SubscriptionResult = z.array(Subscription);
export type SubscriptionResult = z.infer<typeof SubscriptionResult>;

export const QuerySummary = z.object({
  count: z.number().int(),
  sum: MoneyLike,
});
export type QuerySummary = z.infer<typeof QuerySummary>;

export const SubscriptionMatchesQuery = z.object({
  kind: SubscriptionKind,
  rowId: ObjectId,
  categoryId: ObjectId.optional(),
  limit: z.number().int().min(1).max(100).optional(),
});
export type SubscriptionMatchesQuery = z.infer<typeof SubscriptionMatchesQuery>;

export const SubscriptionMatch = z.object({
  id: ObjectId,
  date: ISODate,
  type: ExpenseType,
  sum: MoneyLike,
  title: z.string(),
  receiver: z.string(),
  categoryId: ObjectId,
});
export type SubscriptionMatch = z.infer<typeof SubscriptionMatch>;

export const SubscriptionMatches = z.object({
  matches: z.array(SubscriptionMatch),
  totalCount: z.number().int(),
  totalSum: MoneyLike,
});
export type SubscriptionMatches = z.infer<typeof SubscriptionMatches>;
