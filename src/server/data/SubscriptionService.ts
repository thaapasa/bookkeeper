import {
  assignExpensesToSubscriptions,
  type BaselineWindow,
  baselineWindow,
  buildSubscriptionFilter,
  ExpenseQuery,
  ExpenseType,
  hasMeaningfulConstraint,
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
import { ISODate, RecurrenceInterval, toISODate } from 'shared/time';
import { InvalidInputError, ObjectId } from 'shared/types';
import { Money } from 'shared/util';
import { DbTask } from 'server/data/Db.ts';
import { withSpan } from 'server/telemetry/Spans';

import { getUserExpensesByIds } from './BasicExpenseDb';
import { expandSubCategories } from './CategoryDb';
import {
  getSubscriptionRow,
  getSubscriptionRows,
  SubscriptionRow,
  validateFilterIds,
} from './RecurringExpenseDb';

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
      // Dedup over all candidate expenses regardless of the visible-types
      // filter — narrowing the candidate set up front shifts isPrimary,
      // dominatedBy, and recurrencePerMonth/perYear depending on which
      // type checkboxes are toggled. The type filter is applied as a
      // display filter on the produced cards instead.
      const candidates = await fetchCandidateExpenses(
        tx,
        groupId,
        window.startDate,
        window.endDate,
      );
      const wins = assignExpensesToSubscriptions(candidates, filters);
      const expenseToOwner = invertWins(wins);

      // Only point dominator references at rows that survive the
      // display filter — the UI's "overlaps with: X" notice
      // ("Päällekkäinen tilauksen kanssa: X") for an X that's invisible
      // in the result is just confusing.
      const visibleRowIds = new Set(
        rows.filter(r => rowPassesDisplay(r, criteria, userId, types)).map(r => r.id),
      );
      const rowsById = new Map(rows.map(r => [r.id, r]));
      const cards: Subscription[] = [];
      for (const row of rows) {
        if (!visibleRowIds.has(row.id)) continue;
        const ownedRows = wins.get(row.id) ?? [];
        const dominator =
          ownedRows.length === 0
            ? findDominator(row, filters, candidates, expenseToOwner, rowsById, visibleRowIds)
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
  userId: ObjectId,
  query: ExpenseQuery,
  range?: RecurrenceInterval,
  limit = 0,
): Promise<QuerySummary> {
  return withSpan(
    'subscription.query_summary',
    { 'app.group_id': groupId, 'app.user_id': userId },
    async () => {
      // An empty filter would match every expense in the window — the
      // editor refuses to send one but we guard at the API too so a
      // scripted client can't dump the group's full expense list via
      // this endpoint. The shared check walks an allow-list of
      // constraining fields, so flags the matcher ignores
      // (`includeRecurring`, `includeSubCategories` on its own, raw
      // `startDate`/`endDate`) can't dress up an otherwise empty
      // payload.
      if (!hasMeaningfulConstraint(query)) {
        throw new InvalidInputError('INVALID_INPUT', 'Subscription query must not be empty');
      }
      // Resolve filter IDs against the session group up front so a foreign-group
      // categoryId or userId throws NotFoundError instead of silently producing
      // a zero-match preview — matches the explicit-error contract the create
      // and update paths use.
      await validateFilterIds(tx, groupId, query);
      const window = baselineWindow(range);
      const filter = await buildOneFilter(tx, groupId, 0, query);
      const candidates = await fetchCandidateExpenses(
        tx,
        groupId,
        window.startDate,
        window.endDate,
      );
      const matched: MatchableExpense[] = [];
      let count = 0;
      let sum = Money.from(0);
      for (const expense of candidates) {
        if (scoreFilter(filter, expense) !== null) {
          count += 1;
          sum = sum.plus(expense.sum);
          if (limit > 0) matched.push(expense);
        }
      }
      matched.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.id - a.id));
      const visibleIds = matched.slice(0, limit).map(e => e.id);
      const matches = await getUserExpensesByIds(tx, groupId, userId, visibleIds);
      return { count, sum: sum.toString(), matches };
    },
  );
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
      const row = await getSubscriptionRow(tx, groupId, query.rowId);

      // Re-runs the full dedup pass on every expander click rather than
      // querying just this row's owned candidates. That's load-bearing for
      // correctness: the matches list must reflect the same dedup the
      // search endpoint produced (specificity score, lowest-id tiebreak),
      // so a future "optimise into a single-row query" rewrite would
      // diverge the two views.
      const rows = await getSubscriptionRows(tx, groupId);
      const filters = await buildAllFilters(tx, groupId, rows);
      const candidates = await fetchCandidateExpenses(
        tx,
        groupId,
        window.startDate,
        window.endDate,
      );
      const wins = assignExpensesToSubscriptions(candidates, filters);

      let assigned = wins.get(query.rowId) ?? [];
      // Recurring rows render as one card whose totals already span every
      // owned row (no per-category fan-out), so the expander must too —
      // filtering by the filter's category here would silently hide rows
      // a user manually re-categorised after generation.
      if (query.categoryId !== undefined && !row.period) {
        assigned = assigned.filter(e => e.categoryId === query.categoryId);
      }
      assigned.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.id - a.id));
      const totalCount = assigned.length;
      const totalSum = assigned.reduce((acc, e) => acc.plus(e.sum), Money.from(0)).toString();
      const limit = query.limit ?? 200;
      const visibleIds = assigned.slice(0, limit).map(e => e.id);
      const matches = await getUserExpensesByIds(tx, groupId, userId, visibleIds);
      return { matches, totalCount, totalSum };
    },
  );
}

function toTypeArray(type: SubscriptionSearchCriteria['type']): ExpenseType[] | null {
  if (!type) return null;
  return Array.isArray(type) ? type : [type];
}

async function buildAllFilters(
  tx: DbTask,
  groupId: ObjectId,
  rows: SubscriptionRow[],
): Promise<SubscriptionFilter[]> {
  const out: SubscriptionFilter[] = [];
  for (const r of rows) {
    out.push(await buildOneFilter(tx, groupId, r.id, r.filter));
  }
  return out;
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
  endDate: ISODate,
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
          AND date <= $/endDate/::DATE`,
    { groupId, startDate, endDate },
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
    return [buildCard(row, matches, row.categoryId, window, dominatedBy, true)];
  }
  // Report-style rows fan out by category — broad filters benefit from a
  // per-category breakdown so the page chart can attribute totals.
  if (matches.length === 0) {
    if (row.categoryId === null) return [];
    return [buildCard(row, [], row.categoryId, window, dominatedBy, true)];
  }
  const byCategory = new Map<number, MatchableExpense[]>();
  for (const m of matches) {
    const list = byCategory.get(m.categoryId);
    if (list) list.push(m);
    else byCategory.set(m.categoryId, [m]);
  }
  const entries = Array.from(byCategory.entries());
  const primaryCategory = pickPrimaryCategory(entries, row.categoryId);
  return entries.map(([categoryId, group]) =>
    buildCard(row, group, categoryId, window, undefined, categoryId === primaryCategory),
  );
}

/**
 * Pick the single fan-out card that should carry the subscription's
 * lifecycle actions. Prefer the row's natural `categoryId` if it's in
 * the fan-out (matches in the filter's own category dominate); else
 * fall back to the bucket with the highest realised sum, with category
 * id as a deterministic tiebreaker.
 */
function pickPrimaryCategory(
  entries: readonly [number, MatchableExpense[]][],
  preferred: ObjectId | null,
): number {
  if (preferred !== null && entries.some(([c]) => c === preferred)) return preferred;
  let bestId = entries[0][0];
  let bestSum = sumOf(entries[0][1]);
  for (let i = 1; i < entries.length; i++) {
    const [id, group] = entries[i];
    const s = sumOf(group);
    if (s.gt(bestSum) || (s.equals(bestSum) && id < bestId)) {
      bestId = id;
      bestSum = s;
    }
  }
  return bestId;
}

function sumOf(matches: readonly MatchableExpense[]): Money {
  let s = Money.from(0);
  for (const m of matches) s = s.plus(m.sum);
  return s;
}

function buildCard(
  row: SubscriptionRow,
  matches: MatchableExpense[],
  categoryId: ObjectId | null,
  window: BaselineWindow,
  dominatedBy: { rowId: ObjectId; title: string } | undefined,
  isPrimary: boolean,
): Subscription {
  const stats = aggregate(matches, window.months);
  return {
    id: cardId(row, categoryId),
    rowId: row.id,
    title: row.title,
    categoryId,
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
    isPrimary,
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
 * Strategy: scan candidates that this row's filter accepts, count how
 * many of those rows each visible owner takes, and return the most
 * frequent one. Ties resolve by lowest owner id so the result is stable
 * across requests regardless of SQL ordering.
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
  visibleRowIds: ReadonlySet<number>,
): SubscriptionRowLite | null {
  const ownFilter = filters.find(f => f.id === row.id);
  if (!ownFilter) return null;
  const counts = new Map<number, number>();
  for (const expense of candidates) {
    if (scoreFilter(ownFilter, expense) === null) continue;
    const ownerId = expenseToOwner.get(expense.id);
    if (ownerId === undefined || ownerId === row.id) continue;
    if (!visibleRowIds.has(ownerId)) continue;
    counts.set(ownerId, (counts.get(ownerId) ?? 0) + 1);
  }
  if (counts.size === 0) return null;
  let bestId: number | null = null;
  let bestCount = -1;
  for (const [ownerId, count] of counts) {
    if (count > bestCount || (count === bestCount && (bestId === null || ownerId < bestId))) {
      bestId = ownerId;
      bestCount = count;
    }
  }
  if (bestId === null) return null;
  const owner = rowsById.get(bestId);
  if (!owner) return null;
  return { id: owner.id, title: owner.title };
}
