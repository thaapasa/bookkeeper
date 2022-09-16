import { ITask } from 'pg-promise';

import { ExpenseType } from 'shared/expense';
import { MoneyLike } from 'shared/util';

import { getInvalidDivision, InvalidDivision } from './InvalidDivisionQuery';

interface TypeStatus {
  type: ExpenseType;
  count: number;
  sum: MoneyLike;
}

interface ZeroSumData {
  id: number;
  zerosum: number;
}

export interface DbStatus {
  status: TypeStatus[];
  invalidZerosum: ZeroSumData[];
  invalidDivision: InvalidDivision[];
}

async function getExpenseTypeStatus(
  tx: ITask<any>,
  groupId: number
): Promise<TypeStatus[]> {
  const rows = await tx.manyOrNone<TypeStatus>(
    `SELECT COUNT(*) as count, SUM(sum) AS sum, type
        FROM expenses
        WHERE group_id=$/groupId/
        GROUP BY type`,
    { groupId }
  );
  return rows.map(s => ({ ...s, count: Number(s.count) }));
}

async function getInvalidZeroSumRows(
  tx: ITask<any>,
  groupId: number
): Promise<ZeroSumData[]> {
  const rows = await tx.manyOrNone<Record<string, string>>(
    `SELECT id, zerosum FROM
        (SELECT id, SUM(d.sum) as zerosum
          FROM expenses e
            LEFT JOIN expense_division d ON (e.id = d.expense_id)
          WHERE e.group_id=$/groupId/
          GROUP BY e.id) data
      WHERE zerosum <> 0`,
    { groupId }
  );

  return rows.map(s => ({
    id: Number(s.id),
    zerosum: Number(s.zerosum),
  }));
}

async function getDbStatus(tx: ITask<any>, groupId: number): Promise<DbStatus> {
  return {
    status: await getExpenseTypeStatus(tx, groupId),
    invalidZerosum: await getInvalidZeroSumRows(tx, groupId),
    invalidDivision: await getInvalidDivision(tx, groupId),
  };
}

export const AdminDb = {
  getDbStatus,
};
