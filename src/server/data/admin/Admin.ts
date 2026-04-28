import { DbStatus, TypeStatus, ZeroSumData } from 'shared/types';
import { DbTask } from 'server/data/Db.ts';

import { getInvalidDivision } from './InvalidDivisionQuery';

async function getExpenseTypeStatus(tx: DbTask, groupId: number): Promise<TypeStatus[]> {
  return await tx.manyOrNone<TypeStatus>(
    `SELECT COUNT(*) as count, SUM(sum) AS sum, type
        FROM expenses
        WHERE group_id=$/groupId/
        GROUP BY type`,
    { groupId },
  );
}

async function getInvalidZeroSumRows(tx: DbTask, groupId: number): Promise<ZeroSumData[]> {
  const rows = await tx.manyOrNone<Record<string, string>>(
    `SELECT id, zerosum FROM
        (SELECT id, SUM(d.sum) as zerosum
          FROM expenses e
            LEFT JOIN expense_division d ON (e.id = d.expense_id)
          WHERE e.group_id=$/groupId/
          GROUP BY e.id) data
      WHERE zerosum <> 0`,
    { groupId },
  );

  return rows.map(s => ({
    id: Number(s.id),
    zerosum: Number(s.zerosum),
  }));
}

export async function getDbStatus(tx: DbTask, groupId: number): Promise<DbStatus> {
  return {
    status: await getExpenseTypeStatus(tx, groupId),
    invalidZerosum: await getInvalidZeroSumRows(tx, groupId),
    invalidDivision: await getInvalidDivision(tx, groupId),
  };
}
