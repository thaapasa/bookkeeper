import { z } from 'zod';

import { RecurrenceInterval } from '../time/RecurrenceInterval';
import { ISODate } from '../time/Time';
import { ShortString } from '../types/Common';
import { ObjectId } from '../types/Id';
import { MoneyLike } from '../util/Money';
import { ExpenseQuery, ExpenseType, UserExpense } from './Expense';
import { RecurrencePeriod } from './Recurrence';

export const SubscriptionSearchCriteria = z.object({
  type: ExpenseType.or(z.array(ExpenseType)).optional(),
  includeEnded: z.boolean().optional(),
  onlyOwn: z.boolean().optional(),
  range: RecurrenceInterval.optional(),
});
export type SubscriptionSearchCriteria = z.infer<typeof SubscriptionSearchCriteria>;

/**
 * Template for the auto-generated expenses of a recurring subscription.
 * Division is derived at generation time from `sum` + the source's
 * default split, so it is not part of the template — storing a stale
 * pre-computed division would let a PATCH (or a single-row edit that
 * diverges from defaults) silently produce expense_division rows that
 * violate the `sum(expense_division.sum) = 0` invariant.
 */
export const ExpenseDefaults = z.object({
  title: ShortString,
  receiver: ShortString.optional(),
  sum: MoneyLike,
  type: ExpenseType,
  sourceId: ObjectId,
  categoryId: ObjectId,
  userId: ObjectId,
  confirmed: z.boolean(),
  description: z.string().nullable(),
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
  /**
   * The category bucket this card lives in. `null` for cards whose
   * underlying subscription has no category constraint and that didn't
   * fan out to a per-category breakdown — the UI groups those into a
   * dedicated "uncategorized" section.
   */
  categoryId: ObjectId.nullable(),
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
  /**
   * True for the one card per `rowId` that owns the subscription's
   * lifecycle — edit ("Muokkaa") / end ("Lopeta") / delete ("Poista")
   * actions are rendered only here. Stats subs that fan out across
   * categories produce many cards pointing at the same DB row; only
   * one of them carries the actions so the user can't accidentally
   * delete the whole subscription from a per-category breakdown row.
   */
  isPrimary: z.boolean(),
});
export type Subscription = z.infer<typeof Subscription>;

export const SubscriptionResult = z.array(Subscription);
export type SubscriptionResult = z.infer<typeof SubscriptionResult>;

export const QuerySummary = z.object({
  count: z.number().int(),
  sum: MoneyLike,
  /**
   * Up to `limit` matched expenses (full UserExpense records, newest
   * first), so the client can render them through the same ExpenseRow
   * pipeline as the month/search/grouping views. Empty when `limit` is
   * omitted or 0 — callers that only need a headline number shouldn't
   * pay for the row payload.
   */
  matches: z.array(UserExpense),
});
export type QuerySummary = z.infer<typeof QuerySummary>;

export const SubscriptionPreviewRequest = z.object({
  filter: ExpenseQuery,
  range: RecurrenceInterval.optional(),
  /** Max number of matched expenses to include. Omit / 0 = none. */
  limit: z.number().int().min(0).max(500).optional(),
});
export type SubscriptionPreviewRequest = z.infer<typeof SubscriptionPreviewRequest>;

export const SubscriptionFromFilter = z.object({
  title: z.string().trim().min(1),
  filter: ExpenseQuery,
});
export type SubscriptionFromFilter = z.infer<typeof SubscriptionFromFilter>;

/**
 * Partial subscription edit. Any field omitted is left as-is on the
 * server. Recurrence period and `occurs_until` are intentionally not
 * editable — changing the cadence on a row that already has realised
 * expenses has no clean meaning, and `occurs_until` is owned by the
 * end ("Lopeta") / target=after flows.
 */
export const SubscriptionUpdate = z.object({
  title: z.string().trim().min(1).optional(),
  filter: ExpenseQuery.optional(),
  defaults: ExpenseDefaults.optional(),
});
export type SubscriptionUpdate = z.infer<typeof SubscriptionUpdate>;

export const SubscriptionCreatedResponse = z.object({
  status: z.literal('OK'),
  message: z.string(),
  subscriptionId: ObjectId,
});
export type SubscriptionCreatedResponse = z.infer<typeof SubscriptionCreatedResponse>;

/**
 * Caller-asserted intent for `DELETE /api/subscription/:id`. The server
 * derives the actual operation from the row's state (ongoing recurring
 * → soft "end"; everything else → hard "delete") and rejects with 409
 * when the asserted mode disagrees — guards against UI races where two
 * rapid clicks would otherwise silently escalate "Lopeta" into "Poista".
 */
export const SubscriptionDeleteMode = z.enum(['end', 'delete']);
export type SubscriptionDeleteMode = z.infer<typeof SubscriptionDeleteMode>;

export const SubscriptionDeleteQuery = z.object({
  mode: SubscriptionDeleteMode,
});
export type SubscriptionDeleteQuery = z.infer<typeof SubscriptionDeleteQuery>;

export const SubscriptionMatchesQuery = z.object({
  rowId: ObjectId,
  categoryId: ObjectId.optional(),
  limit: z.number().int().min(1).max(500).optional(),
  /**
   * Window for the dedup pass. Should match the page's range selector
   * so the expander's row list is consistent with the card's totals.
   * Defaults to 5y when omitted.
   */
  range: RecurrenceInterval.optional(),
});
export type SubscriptionMatchesQuery = z.infer<typeof SubscriptionMatchesQuery>;

export const SubscriptionMatches = z.object({
  matches: z.array(UserExpense),
  totalCount: z.number().int(),
  totalSum: MoneyLike,
});
export type SubscriptionMatches = z.infer<typeof SubscriptionMatches>;
