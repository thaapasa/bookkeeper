import {
  assignExpensesToSubscriptions,
  buildSubscriptionFilter,
  ExpenseQuery,
  ExpenseType,
  MatchableExpense,
  QuerySummary,
  scoreFilter,
  Subscription,
  SubscriptionFilter,
  SubscriptionMatches,
  SubscriptionMatchesQuery,
  SubscriptionResult,
  SubscriptionSearchCriteria,
} from 'shared/expense';
import { ISODate, RecurrenceInterval, toDateTime, toISODate } from 'shared/time';
import { ObjectId } from 'shared/types';
import { Money } from 'shared/util';
import { DbTask } from 'server/data/Db.ts';
import { withSpan } from 'server/telemetry/Spans';

import { expandSubCategories } from './CategoryDb';
import { getSubscriptionRow, getSubscriptionRows, SubscriptionRow } from './RecurringExpenseDb';

const defaultBaselineRange: RecurrenceInterval = { amount: 5, unit: 'years' };

interface BaselineWindow {
  startDate: ISODate;
  months: number;
}

export function searchSubscriptions(
  tx: DbTask,
  groupId: ObjectId,
  userId: ObjectId,
  criteria: SubscriptionSearchCriteria,
): Promise<SubscriptionResult> {
  return withSpan(
    'subscription.search',
    { 'app.group_id': groupId, 'app.user_id': userId },
    async () => {
      const window = baselineWindow(criteria.range);
      const types = toTypeArray(criteria.type);

      const rows = await getSubscriptionRows(tx, groupId);
      const filters = await buildAllFilters(tx, groupId, rows);
      const candidates = await fetchCandidateExpenses(tx, groupId, window.startDate, types);
      const wins = assignExpensesToSubscriptions(candidates, filters);
      const expenseToOwner = invertWins(wins);

      const rowsById = new Map(rows.map(r => [r.id, r]));
      const cards: Subscription[] = [];
      for (const row of rows) {
        if (!rowPassesDisplay(row, criteria, userId, types)) continue;
        const ownedRows = wins.get(row.id) ?? [];
        const dominator =
          ownedRows.length === 0
            ? findDominator(row, filters, candidates, expenseToOwner, rowsById)
            : null;
        const dominatedBy = dominator ? { rowId: dominator.id, title: dominator.title } : undefined;
        cards.push(...buildCardsForRow(row, ownedRows, window, dominatedBy));
      }
      return cards;
    },
  );
}

export function summarizeQuery(
  tx: DbTask,
  groupId: ObjectId,
  query: ExpenseQuery,
  range?: RecurrenceInterval,
): Promise<QuerySummary> {
  return withSpan('subscription.query_summary', { 'app.group_id': groupId }, async () => {
    const window = baselineWindow(range);
    const filter = await buildOneFilter(tx, groupId, 0, query);
    const candidates = await fetchCandidateExpenses(tx, groupId, window.startDate, null);
    let count = 0;
    let sum = Money.from(0);
    for (const expense of candidates) {
      if (scoreFilter(filter, expense) !== null) {
        count += 1;
        sum = sum.plus(expense.sum);
      }
    }
    return { count, sum: sum.toString() };
  });
}

export function getSubscriptionMatches(
  tx: DbTask,
  groupId: ObjectId,
  userId: ObjectId,
  query: SubscriptionMatchesQuery,
): Promise<SubscriptionMatches> {
  return withSpan(
    'subscription.matches',
    {
      'app.group_id': groupId,
      'app.user_id': userId,
      'app.subscription_id': query.rowId,
    },
    async () => {
      const window = baselineWindow(query.range);
      // Verify the row exists; throws NotFoundError otherwise.
      await getSubscriptionRow(tx, groupId, query.rowId);

      const rows = await getSubscriptionRows(tx, groupId);
      const filters = await buildAllFilters(tx, groupId, rows);
      const candidates = await fetchCandidateExpenses(tx, groupId, window.startDate, null);
      const wins = assignExpensesToSubscriptions(candidates, filters);

      let assigned = wins.get(query.rowId) ?? [];
      if (query.categoryId !== undefined) {
        assigned = assigned.filter(e => e.categoryId === query.categoryId);
      }
      assigned.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.id - a.id));
      const totalCount = assigned.length;
      const totalSum = assigned.reduce((acc, e) => acc.plus(e.sum), Money.from(0)).toString();
      const limit = query.limit ?? 200;
      const matches = assigned.slice(0, limit).map(e => ({
        id: e.id,
        date: e.date,
        type: e.type,
        sum: e.sum,
        title: e.title,
        receiver: e.receiver,
        categoryId: e.categoryId,
      }));
      return { matches, totalCount, totalSum };
    },
  );
}

function toTypeArray(type: SubscriptionSearchCriteria['type']): ExpenseType[] | null {
  if (!type) return null;
  return Array.isArray(type) ? type : [type];
}

function baselineWindow(range: RecurrenceInterval = defaultBaselineRange): BaselineWindow {
  const now = toDateTime();
  const startDate = now.minus({ [range.unit]: range.amount });
  return { startDate: toISODate(startDate), months: now.diff(startDate, 'months').months };
}

async function buildAllFilters(
  tx: DbTask,
  groupId: ObjectId,
  rows: SubscriptionRow[],
): Promise<SubscriptionFilter[]> {
  return Promise.all(rows.map(r => buildOneFilter(tx, groupId, r.id, r.filter)));
}

async function buildOneFilter(
  tx: DbTask,
  groupId: ObjectId,
  id: ObjectId,
  filter: ExpenseQuery,
): Promise<SubscriptionFilter> {
  const subtree = await expandSubtreeIds(tx, groupId, filter);
  return buildSubscriptionFilter(id, filter, subtree);
}

async function expandSubtreeIds(
  tx: DbTask,
  groupId: ObjectId,
  filter: ExpenseQuery,
): Promise<number[]> {
  if (!filter.includeSubCategories || filter.categoryId === undefined) return [];
  const ids = Array.isArray(filter.categoryId) ? filter.categoryId : [filter.categoryId];
  return expandSubCategories(tx, groupId, ids);
}

async function fetchCandidateExpenses(
  tx: DbTask,
  groupId: ObjectId,
  startDate: ISODate,
  types: ExpenseType[] | null,
): Promise<MatchableExpense[]> {
  const rows = await tx.manyOrNone<{
    id: number;
    date: ISODate;
    type: ExpenseType;
    sum: string;
    title: string;
    receiver: string | null;
    userId: number;
    categoryId: number;
    confirmed: boolean;
  }>(
    `--sql
      SELECT
        id,
        date::DATE AS date,
        type,
        sum,
        title,
        receiver,
        user_id AS "userId",
        category_id AS "categoryId",
        confirmed
        FROM expenses
        WHERE group_id = $/groupId/
          AND date >= $/startDate/::DATE
          ${types ? 'AND type IN ($/types:csv/)' : ''}`,
    { groupId, startDate, types },
  );
  return rows.map(r => ({
    id: r.id,
    date: toISODate(r.date),
    type: r.type,
    sum: r.sum,
    title: r.title,
    receiver: r.receiver ?? '',
    userId: r.userId,
    categoryId: r.categoryId,
    confirmed: r.confirmed,
  }));
}

function rowPassesDisplay(
  row: SubscriptionRow,
  criteria: SubscriptionSearchCriteria,
  sessionUserId: ObjectId,
  types: ExpenseType[] | null,
): boolean {
  if (!criteria.includeEnded && row.occursUntil && row.occursUntil <= toISODate()) return false;
  if (criteria.onlyOwn && row.userId !== sessionUserId) return false;
  // For recurring rows, the canonical type lives on `defaults`. For
  // report-style rows the type can be in the filter (or unset, in
  // which case the row matches all types). The display filter narrows
  // by the row's most authoritative type.
  if (types && !typeMatchesDisplay(row, types)) return false;
  return true;
}

function typeMatchesDisplay(row: SubscriptionRow, types: ExpenseType[]): boolean {
  if (row.defaults) return types.includes(row.defaults.type);
  if (row.filter.type) {
    const filterTypes = Array.isArray(row.filter.type) ? row.filter.type : [row.filter.type];
    return filterTypes.some(t => types.includes(t));
  }
  // No type constraint anywhere — the row is type-agnostic, keep it.
  return true;
}

function buildCardsForRow(
  row: SubscriptionRow,
  matches: MatchableExpense[],
  window: BaselineWindow,
  dominatedBy: { rowId: ObjectId; title: string } | undefined,
): Subscription[] {
  // Recurring rows always live in a single category and become exactly one card.
  if (row.period) {
    return [buildCard(row, matches, row.categoryId, window, dominatedBy)];
  }
  // Report-style rows fan out by category — broad filters benefit from a
  // per-category breakdown so the page chart can attribute totals.
  if (matches.length === 0) {
    if (row.categoryId === null) return [];
    return [buildCard(row, [], row.categoryId, window, dominatedBy)];
  }
  const byCategory = new Map<number, MatchableExpense[]>();
  for (const m of matches) {
    const list = byCategory.get(m.categoryId);
    if (list) list.push(m);
    else byCategory.set(m.categoryId, [m]);
  }
  return Array.from(byCategory.entries()).map(([categoryId, group]) =>
    buildCard(row, group, categoryId, window, undefined),
  );
}

function buildCard(
  row: SubscriptionRow,
  matches: MatchableExpense[],
  categoryId: ObjectId | null,
  window: BaselineWindow,
  dominatedBy: { rowId: ObjectId; title: string } | undefined,
): Subscription {
  const stats = aggregate(matches, window.months);
  const cardCategoryId = categoryId ?? 0;
  return {
    id: cardId(row, categoryId),
    rowId: row.id,
    title: row.title,
    categoryId: cardCategoryId,
    filter: row.filter,
    recurrence: row.period,
    defaults: row.defaults,
    nextMissing: row.nextMissing,
    occursUntil: row.occursUntil,
    matchedCount: stats.count,
    matchedSum: stats.sum.toString(),
    firstDate: stats.firstDate,
    lastDate: stats.lastDate,
    recurrencePerMonth: stats.perMonth.toString(),
    recurrencePerYear: stats.perYear.toString(),
    dominatedBy,
  };
}

function cardId(row: SubscriptionRow, categoryId: ObjectId | null): string {
  if (row.period) return `subscription-${row.id}`;
  return `subscription-${row.id}-${categoryId ?? 'uncat'}`;
}

interface AggregatedStats {
  count: number;
  sum: Money;
  firstDate?: ISODate;
  lastDate?: ISODate;
  perMonth: Money;
  perYear: Money;
}

function aggregate(matches: MatchableExpense[], months: number): AggregatedStats {
  if (matches.length === 0) {
    return {
      count: 0,
      sum: Money.from(0),
      perMonth: Money.from(0),
      perYear: Money.from(0),
    };
  }
  let sum = Money.from(0);
  let firstDate = matches[0].date;
  let lastDate = matches[0].date;
  for (const m of matches) {
    sum = sum.plus(m.sum);
    if (m.date < firstDate) firstDate = m.date;
    if (m.date > lastDate) lastDate = m.date;
  }
  const perMonth = months > 0 ? sum.divide(months) : Money.from(0);
  return {
    count: matches.length,
    sum,
    firstDate,
    lastDate,
    perMonth,
    perYear: perMonth.multiply(12),
  };
}

function invertWins(wins: Map<number, MatchableExpense[]>): Map<number, number> {
  const out = new Map<number, number>();
  for (const [filterId, expenses] of wins) {
    for (const e of expenses) out.set(e.id, filterId);
  }
  return out;
}

/**
 * For an "empty" subscription row (no rows assigned by dedup), find the
 * subscription that dominates its filter — i.e. the one currently
 * owning the rows this row's filter would otherwise have matched.
 *
 * Strategy: scan candidates that this row's filter accepts; the first
 * such expense's owner (post-dedup) is the dominator. If multiple
 * dominators are possible we'd pick the most common one, but in
 * practice duplicates almost always all funnel into the same older
 * subscription — first match is sufficient.
 */
interface SubscriptionRowLite {
  id: ObjectId;
  title: string;
}

function findDominator(
  row: SubscriptionRow,
  filters: readonly SubscriptionFilter[],
  candidates: readonly MatchableExpense[],
  expenseToOwner: Map<number, number>,
  rowsById: Map<number, SubscriptionRow>,
): SubscriptionRowLite | null {
  const ownFilter = filters.find(f => f.id === row.id);
  if (!ownFilter) return null;
  for (const expense of candidates) {
    if (scoreFilter(ownFilter, expense) === null) continue;
    const ownerId = expenseToOwner.get(expense.id);
    if (ownerId === undefined || ownerId === row.id) continue;
    const owner = rowsById.get(ownerId);
    if (!owner) continue;
    return { id: owner.id, title: owner.title };
  }
  return null;
}
