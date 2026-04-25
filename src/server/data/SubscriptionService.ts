import {
  assignExpensesToSubscriptions,
  buildSubscriptionFilter,
  ExpenseQuery,
  ExpenseReport,
  ExpenseType,
  filterKey,
  FilterSource,
  MatchableExpense,
  RecurringExpense,
  ReportDef,
  SubscriptionFilter,
  SubscriptionResult,
  SubscriptionSearchCriteria,
} from 'shared/expense';
import { ISODate, RecurrenceInterval, toDateTime, toISODate } from 'shared/time';
import { ObjectId } from 'shared/types';
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

      const recurringExpenses = recurringRows
        .filter(r => recurringPassesDisplay(r, criteria, userId, types))
        .map(r =>
          buildRecurringExpense(
            r,
            wins.get(filterKey({ source: 'recurring', id: r.id })) ?? [],
            window,
          ),
        );

      const reports = reportDefs.flatMap(r =>
        buildReportCards(r, wins.get(filterKey({ source: 'report', id: r.id })) ?? [], window),
      );

      return { recurringExpenses, reports };
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
          AND template = false
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

function buildRecurringExpense(
  row: RecurringRow,
  matches: MatchableExpense[],
  window: BaselineWindow,
): RecurringExpense {
  const { perMonth, perYear } = baselineFromMatches(matches, window.months);
  return {
    id: row.id,
    type: 'recurring',
    templateExpenseId: row.templateExpenseId,
    title: row.title,
    receiver: row.receiver || undefined,
    sum: row.sum,
    categoryId: row.categoryId,
    period: row.period,
    nextMissing: row.nextMissing,
    firstOccurence: row.firstOccurence,
    occursUntil: row.occursUntil ?? undefined,
    recurrencePerMonth: perMonth.toString(),
    recurrencePerYear: perYear.toString(),
  };
}

function buildReportCards(
  def: ReportDef,
  matches: MatchableExpense[],
  window: BaselineWindow,
): ExpenseReport[] {
  if (matches.length === 0) return [];
  const byCategory = new Map<number, MatchableExpense[]>();
  for (const m of matches) {
    const list = byCategory.get(m.categoryId);
    if (list) list.push(m);
    else byCategory.set(m.categoryId, [m]);
  }
  const out: ExpenseReport[] = [];
  for (const [categoryId, group] of byCategory) {
    const total = sumExpenses(group);
    const titles = group.map(e => e.title);
    const dates = group.map(e => e.date).sort();
    const { perMonth, perYear } = baselineFromTotal(total, window.months);
    out.push({
      id: `report-${def.id}-${categoryId}`,
      type: 'report',
      title: def.title,
      categoryId,
      count: group.length,
      sum: total.toString(),
      avgSum: total.divide(group.length).toString(),
      firstDate: dates[0],
      lastDate: dates[dates.length - 1],
      minExpenseTitle: minString(titles),
      maxExpenseTitle: maxString(titles),
      recurrencePerMonth: perMonth.toString(),
      recurrencePerYear: perYear.toString(),
      reportId: def.id,
    });
  }
  return out;
}

function sumExpenses(expenses: MatchableExpense[]): Money {
  return expenses.reduce((acc, e) => acc.plus(e.sum), Money.from(0));
}

function baselineFromMatches(
  matches: MatchableExpense[],
  months: number,
): { perMonth: Money; perYear: Money } {
  if (matches.length === 0 || months <= 0) {
    return { perMonth: Money.from(0), perYear: Money.from(0) };
  }
  return baselineFromTotal(sumExpenses(matches), months);
}

function baselineFromTotal(total: Money, months: number): { perMonth: Money; perYear: Money } {
  if (months <= 0) return { perMonth: Money.from(0), perYear: Money.from(0) };
  const perMonth = total.divide(months);
  return { perMonth, perYear: perMonth.multiply(12) };
}

function minString(values: string[]): string {
  return values.reduce((acc, v) => (v < acc ? v : acc));
}

function maxString(values: string[]): string {
  return values.reduce((acc, v) => (v > acc ? v : acc));
}
