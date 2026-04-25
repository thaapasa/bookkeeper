import {
  assignExpensesToSubscriptions,
  buildSubscriptionFilter,
  ExpenseQuery,
  ExpenseType,
  filterKey,
  FilterSource,
  MatchableExpense,
  QuerySummary,
  ReportDef,
  scoreFilter,
  Subscription,
  SubscriptionFilter,
  SubscriptionMatches,
  SubscriptionMatchesQuery,
  SubscriptionResult,
  SubscriptionSearchCriteria,
} from 'shared/expense';
import { ISODate, RecurrenceInterval, toDateTime, toISODate } from 'shared/time';
import { NotFoundError, ObjectId } from 'shared/types';
import { Money } from 'shared/util';
import { DbTask } from 'server/data/Db.ts';
import { withSpan } from 'server/telemetry/Spans';

import { expandSubCategories } from './CategoryDb';
import { getRecurringRows, RecurringRow } from './RecurringExpenseDb';
import { getAllReports } from './ReportDb';

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

      const [recurringRows, reportDefs] = await Promise.all([
        getRecurringRows(tx, groupId),
        getAllReports(tx, groupId),
      ]);

      const filters = await buildAllFilters(tx, groupId, recurringRows, reportDefs);
      const candidates = await fetchCandidateExpenses(tx, groupId, window.startDate, types);
      const wins = assignExpensesToSubscriptions(candidates, filters);

      const recurringCards = recurringRows
        .filter(r => recurringPassesDisplay(r, criteria, userId, types))
        .map(r =>
          buildRecurringSubscription(
            r,
            wins.get(filterKey({ source: 'recurring', id: r.id })) ?? [],
            window,
          ),
        );

      const reportCards = reportDefs.flatMap(r =>
        buildReportSubscriptions(
          r,
          wins.get(filterKey({ source: 'report', id: r.id })) ?? [],
          window,
        ),
      );

      return [...recurringCards, ...reportCards];
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
    const filter = await buildOneFilter(tx, groupId, 'report', 0, query);
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
      'app.subscription_kind': query.kind,
      'app.subscription_id': query.rowId,
    },
    async () => {
      const window = baselineWindow();
      const [recurringRows, reportDefs] = await Promise.all([
        getRecurringRows(tx, groupId),
        getAllReports(tx, groupId),
      ]);
      const filters = await buildAllFilters(tx, groupId, recurringRows, reportDefs);
      verifyTargetExists(query, recurringRows, reportDefs);
      const candidates = await fetchCandidateExpenses(tx, groupId, window.startDate, null);
      const wins = assignExpensesToSubscriptions(candidates, filters);
      const targetKey = filterKey({ source: query.kind, id: query.rowId });
      let assigned = wins.get(targetKey) ?? [];
      if (query.categoryId !== undefined) {
        assigned = assigned.filter(e => e.categoryId === query.categoryId);
      }
      assigned.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.id - a.id));
      const totalCount = assigned.length;
      const totalSum = assigned.reduce((acc, e) => acc.plus(e.sum), Money.from(0)).toString();
      const limit = query.limit ?? 20;
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

function verifyTargetExists(
  query: SubscriptionMatchesQuery,
  recurringRows: RecurringRow[],
  reportDefs: ReportDef[],
) {
  const exists =
    query.kind === 'recurring'
      ? recurringRows.some(r => r.id === query.rowId)
      : reportDefs.some(r => r.id === query.rowId);
  if (!exists) {
    throw new NotFoundError('SUBSCRIPTION_NOT_FOUND', `${query.kind} subscription`, query.rowId);
  }
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
  recurringRows: RecurringRow[],
  reportDefs: ReportDef[],
): Promise<SubscriptionFilter[]> {
  return Promise.all([
    ...recurringRows.map(r => buildOneFilter(tx, groupId, 'recurring', r.id, r.filter)),
    ...reportDefs.map(r => buildOneFilter(tx, groupId, 'report', r.id, r.query)),
  ]);
}

async function buildOneFilter(
  tx: DbTask,
  groupId: ObjectId,
  source: FilterSource,
  id: ObjectId,
  filter: ExpenseQuery,
): Promise<SubscriptionFilter> {
  const subtree = await expandSubtreeIds(tx, groupId, filter);
  return buildSubscriptionFilter(source, id, filter, subtree);
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

function recurringPassesDisplay(
  row: RecurringRow,
  criteria: SubscriptionSearchCriteria,
  sessionUserId: ObjectId,
  types: ExpenseType[] | null,
): boolean {
  if (!criteria.includeEnded && row.occursUntil && row.occursUntil < toISODate()) return false;
  if (criteria.onlyOwn && row.templateUserId !== sessionUserId) return false;
  if (types && !types.includes(row.type)) return false;
  return true;
}

function buildRecurringSubscription(
  row: RecurringRow,
  matches: MatchableExpense[],
  window: BaselineWindow,
): Subscription {
  const stats = aggregate(matches, window.months);
  return {
    id: `recurring-${row.id}`,
    kind: 'recurring',
    rowId: row.id,
    title: row.title,
    categoryId: row.categoryId,
    filter: row.filter,
    recurrence: row.period,
    defaults: row.defaults,
    nextMissing: row.nextMissing,
    occursUntil: row.occursUntil ?? undefined,
    matchedCount: stats.count,
    matchedSum: stats.sum.toString(),
    firstDate: stats.firstDate,
    lastDate: stats.lastDate,
    recurrencePerMonth: stats.perMonth.toString(),
    recurrencePerYear: stats.perYear.toString(),
  };
}

function buildReportSubscriptions(
  def: ReportDef,
  matches: MatchableExpense[],
  window: BaselineWindow,
): Subscription[] {
  if (matches.length === 0) {
    // Reports with no matches are still real subscriptions; show one
    // card pinned at the filter's primary category so the user can see
    // and edit the row even when its filter currently matches nothing.
    const categoryId = primaryCategoryId(def.query);
    if (categoryId === undefined) return [];
    return [
      {
        id: `report-${def.id}-${categoryId}`,
        kind: 'report',
        rowId: def.id,
        title: def.title,
        categoryId,
        filter: def.query,
        matchedCount: 0,
        matchedSum: '0',
        recurrencePerMonth: '0',
        recurrencePerYear: '0',
      },
    ];
  }
  const byCategory = new Map<number, MatchableExpense[]>();
  for (const m of matches) {
    const list = byCategory.get(m.categoryId);
    if (list) list.push(m);
    else byCategory.set(m.categoryId, [m]);
  }
  return Array.from(byCategory.entries()).map(([categoryId, group]) => {
    const stats = aggregate(group, window.months);
    return {
      id: `report-${def.id}-${categoryId}`,
      kind: 'report',
      rowId: def.id,
      title: def.title,
      categoryId,
      filter: def.query,
      matchedCount: stats.count,
      matchedSum: stats.sum.toString(),
      firstDate: stats.firstDate,
      lastDate: stats.lastDate,
      recurrencePerMonth: stats.perMonth.toString(),
      recurrencePerYear: stats.perYear.toString(),
    };
  });
}

function primaryCategoryId(filter: ExpenseQuery): ObjectId | undefined {
  if (filter.categoryId === undefined) return undefined;
  return Array.isArray(filter.categoryId) ? filter.categoryId[0] : filter.categoryId;
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
