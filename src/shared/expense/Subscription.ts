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
 * One subscription card. A subscription row with `recurrence` produces
 * exactly one card; a non-recurring row (formerly a "report") produces
 * one card per category that its assigned rows span — broad filters
 * benefit from a per-category breakdown, recurring rows always live in
 * one category by construction.
 *
 * `id` is unique across all cards in a result. `rowId` points at the
 * underlying `subscriptions` row for edit/delete operations.
 *
 * `dominatedBy` is set when this card has zero matched rows because a
 * higher-scoring (or older) subscription took everything its filter
 * would otherwise match. The UI surfaces this so the user knows to
 * delete the redundant row.
 */
export const Subscription = z.object({
  id: z.string(),
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
  dominatedBy: z
    .object({
      rowId: ObjectId,
      title: z.string(),
    })
    .optional(),
});
export type Subscription = z.infer<typeof Subscription>;

export const SubscriptionResult = z.array(Subscription);
export type SubscriptionResult = z.infer<typeof SubscriptionResult>;

export const QuerySummary = z.object({
  count: z.number().int(),
  sum: MoneyLike,
});
export type QuerySummary = z.infer<typeof QuerySummary>;

export const SubscriptionFromFilter = z.object({
  title: z.string().trim().min(1),
  filter: ExpenseQuery,
});
export type SubscriptionFromFilter = z.infer<typeof SubscriptionFromFilter>;

export const SubscriptionCreatedResponse = z.object({
  status: z.literal('OK'),
  message: z.string(),
  subscriptionId: ObjectId,
});
export type SubscriptionCreatedResponse = z.infer<typeof SubscriptionCreatedResponse>;

export const SubscriptionMatchesQuery = z.object({
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
