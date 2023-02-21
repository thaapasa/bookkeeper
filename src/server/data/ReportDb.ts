import { ITask } from 'pg-promise';

import { ExpenseQuery, ExpenseReport, ReportDef } from 'shared/expense';
import { SubscriptionSearchCriteria } from 'shared/expense/Subscription';
import { toISODate, toMoment } from 'shared/time';
import { ObjectId } from 'shared/types';
import { Money } from 'shared/util';

import { getExpenseSearchQuery } from './ExpenseSearch';

const ReportSelectFields = `id, group_id AS "groupId", user_id AS "userId", title, query`;

export async function getAllReports(
  tx: ITask<any>,
  groupId: ObjectId
): Promise<ReportDef[]> {
  const s = await tx.manyOrNone<ReportDef>(
    `SELECT ${ReportSelectFields}
       FROM reports
       WHERE group_id=$/groupId/`,
    { groupId }
  );
  return s;
}

export async function createReport(
  tx: ITask<any>,
  groupId: ObjectId,
  userId: ObjectId,
  title: string,
  query: ExpenseQuery
): Promise<ReportDef> {
  // Check that source id is correct
  const row = await tx.one<ReportDef>(
    `INSERT INTO reports (group_id, user_id, title, query)
      VALUES ($/groupId/, $/userId/, $/title/, $/query/::JSONB)
      RETURNING ${ReportSelectFields}`,
    { groupId, userId, title, query }
  );
  return row;
}

export async function searchReports(
  tx: ITask<any>,
  groupId: ObjectId,
  userId: ObjectId,
  criteria: SubscriptionSearchCriteria
): Promise<ExpenseReport[]> {
  const reports = await getAllReports(tx, groupId);

  const reportData = await Promise.all(
    reports.map(r => calculateExpenseReports(tx, groupId, userId, r, criteria))
  );
  return reportData.flat();
}

type ExpenseReportFromDb = Pick<
  ExpenseReport,
  | 'categoryId'
  | 'sum'
  | 'firstDate'
  | 'lastDate'
  | 'minExpenseTitle'
  | 'maxExpenseTitle'
  | 'count'
>;

async function calculateExpenseReports(
  tx: ITask<any>,
  groupId: ObjectId,
  userId: ObjectId,
  report: ReportDef,
  criteria: SubscriptionSearchCriteria
): Promise<ExpenseReport[]> {
  const { clause, params } = await getExpenseSearchQuery(tx, userId, groupId, {
    // Do not include recurring subscriptions as they are tracked separately
    includeRecurring: false,
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
    params
  );

  return overview.map(o => fillInReportData(o, report));
}

function fillInReportData(
  rowData: ExpenseReportFromDb,
  def: ReportDef
): ExpenseReport {
  const firstDate = toMoment(rowData.firstDate);
  const lastDate = toMoment(rowData.lastDate);
  const totalDays = toMoment().diff(firstDate, 'days');
  const sum = Money.from(rowData.sum);
  const perYear = sum.multiply(365.25).divide(totalDays);
  return {
    ...rowData,
    sum: sum.toString(),
    avgSum: sum.divide(rowData.count).toString(),
    firstDate: toISODate(firstDate),
    lastDate: toISODate(lastDate),
    id: `report-${def.id}-${rowData.categoryId}`,
    type: 'report',
    title: def.title,
    recurrencePerMonth: perYear.divide(12).toString(),
    recurrencePerYear: perYear.toString(),
  };
}
