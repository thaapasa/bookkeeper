import { ITask } from 'pg-promise';

import { ExpenseQuery, Report } from 'shared/expense';
import { ObjectId } from 'shared/types';

const ReportSelectFields = `id, group_id AS "groupId", user_id AS "userId", title, search_terms AS "searchTerms"`;

async function getAll(tx: ITask<any>, groupId: ObjectId): Promise<Report[]> {
  const s = await tx.manyOrNone<Report>(
    `SELECT ${ReportSelectFields}
       FROM reports
       WHERE group_id=$/groupId/`,
    { groupId }
  );
  return s;
}

async function createReport(
  tx: ITask<any>,
  groupId: ObjectId,
  userId: ObjectId,
  title: string,
  searchTerms: ExpenseQuery
): Promise<Report> {
  // Check that source id is correct
  const row = await tx.one<Report>(
    `INSERT INTO reports (group_id, user_id, title, search_terms)
      VALUES ($/groupId/, $/userId/, $/title/, $/searchTerms/::JSONB)
      RETURNING ${ReportSelectFields}`,
    { groupId, userId, title, searchTerms }
  );
  return row;
}

export const ReportDb = {
  getAll,
  createReport,
};
