import { ExpenseQuery, ReportDef } from 'shared/expense';
import { ApiMessage, ObjectId } from 'shared/types';
import { DbTask } from 'server/data/Db.ts';
import { withSpan } from 'server/telemetry/Spans';

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

export function createReport(
  tx: DbTask,
  groupId: ObjectId,
  userId: ObjectId,
  title: string,
  query: ExpenseQuery,
): Promise<ReportDef> {
  return withSpan('report.create', { 'app.group_id': groupId, 'app.user_id': userId }, () =>
    tx.one<ReportDef>(
      `INSERT INTO reports (group_id, user_id, title, query)
          VALUES ($/groupId/, $/userId/, $/title/, $/query/::JSONB)
          RETURNING ${ReportSelectFields}`,
      { groupId, userId, title, query },
    ),
  );
}

export function deleteReport(
  tx: DbTask,
  groupId: ObjectId,
  reportId: ObjectId,
): Promise<ApiMessage> {
  return withSpan(
    'report.delete',
    { 'app.group_id': groupId, 'app.report_id': reportId },
    async () => {
      const res = await tx.result(
        `DELETE FROM reports WHERE (id = $/reportId/ AND group_id = $/groupId/)`,
        { reportId, groupId },
      );
      return {
        status: 'OK',
        message: res.rowCount === 1 ? 'Report deleted' : 'No reports found',
      };
    },
  );
}
