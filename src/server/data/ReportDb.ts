import { ExpenseQuery, ExpenseReport, ReportDef, SubscriptionSearchCriteria } from 'shared/expense';
import { MomentInterval, toDateTime, toISODate } from 'shared/time';
import { ApiMessage, ObjectId } from 'shared/types';
import { Money } from 'shared/util';
import { DbTask } from 'server/data/Db.ts';

import { getExpenseSearchQuery } from './ExpenseSearch';

const ReportSelectFields = `id, group_id AS "groupId", user_id AS "userId", title, query`;

export async function getAllReports(tx: DbTask, groupId: ObjectId): Promise<ReportDef[]> {
  const s = await tx.manyOrNone<ReportDef>(
    `SELECT ${ReportSelectFields}
       FROM reports
       WHERE group_id=$/groupId/`,
    { groupId },
  );
  return s;
}

export async function createReport(
  tx: DbTask,
  groupId: ObjectId,
  userId: ObjectId,
  title: string,
  query: ExpenseQuery,
): Promise<ReportDef> {
  // Check that source id is correct
  const row = await tx.one<ReportDef>(
    `INSERT INTO reports (group_id, user_id, title, query)
      VALUES ($/groupId/, $/userId/, $/title/, $/query/::JSONB)
      RETURNING ${ReportSelectFields}`,
    { groupId, userId, title, query },
  );
  return row;
}

export async function deleteReport(
  tx: DbTask,
  groupId: ObjectId,
  reportId: ObjectId,
): Promise<ApiMessage> {
  const res = await tx.result(
    `DELETE FROM reports WHERE (id = $/reportId/ AND group_id = $/groupId/)`,
    {
      reportId,
      groupId,
    },
  );
  return {
    status: 'OK',
    message: res.rowCount === 1 ? 'Report deleted' : 'No reports found',
  };
}

export async function searchReports(
  tx: DbTask,
  groupId: ObjectId,
  userId: ObjectId,
  criteria: SubscriptionSearchCriteria,
): Promise<ExpenseReport[]> {
  const reports = await getAllReports(tx, groupId);

  const reportData = await Promise.all(
    reports.map(r => calculateExpenseReports(tx, groupId, userId, r, criteria)),
  );
  return reportData.flat();
}

type ExpenseReportFromDb = Pick<
  ExpenseReport,
  'categoryId' | 'sum' | 'firstDate' | 'lastDate' | 'minExpenseTitle' | 'maxExpenseTitle' | 'count'
>;

const defaultSearchRanage: MomentInterval = { amount: 5, unit: 'years' };

async function calculateExpenseReports(
  tx: DbTask,
  groupId: ObjectId,
  userId: ObjectId,
  report: ReportDef,
  criteria: SubscriptionSearchCriteria,
): Promise<ExpenseReport[]> {
  const range = criteria.range ?? defaultSearchRanage;
  const { clause, params } = await getExpenseSearchQuery(tx, userId, groupId, {
    // Do not include recurring subscriptions as they are tracked separately
    includeRecurring: false,
    startDate: toISODate(toDateTime().minus({ [range.unit]: range.amount })),
    ...report.query,
    ...(criteria.onlyOwn ? { userId } : undefined),
    ...(criteria.type ? { type: criteria.type } : undefined),
  });
  const overview = await tx.manyOrNone<ExpenseReportFromDb>(
    `SELECT "categoryId",
      SUM(sum) AS sum,
      MIN(date) AS "firstDate", MAX(date) AS "lastDate",
      MIN(title) AS "minExpenseTitle", MAX(title) AS "maxExpenseTitle",
      COUNT(*) AS count
      FROM (${clause}) results
      GROUP BY "categoryId"`,
    params,
  );

  return overview.map(o => fillInReportData(o, report));
}

function fillInReportData(rowData: ExpenseReportFromDb, def: ReportDef): ExpenseReport {
  const firstDate = toDateTime(rowData.firstDate);
  const lastDate = toDateTime(rowData.lastDate);
  const totalDays = toDateTime().diff(firstDate, 'days').days;
  const sum = Money.from(rowData.sum);
  const perYear = sum.multiply(365.25).divide(totalDays);
  return {
    ...rowData,
    count: Number(rowData.count),
    sum: sum.toString(),
    avgSum: sum.divide(rowData.count).toString(),
    firstDate: toISODate(firstDate),
    lastDate: toISODate(lastDate),
    id: `report-${def.id}-${rowData.categoryId}`,
    type: 'report',
    title: def.title,
    recurrencePerMonth: perYear.divide(12).toString(),
    recurrencePerYear: perYear.toString(),
    reportId: def.id,
  };
}
