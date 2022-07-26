import { IBaseProtocol } from 'pg-promise';

import { ExpenseType } from 'shared/types/Expense';
import { MoneyLike } from 'shared/util/Money';

import { db } from '../Db';
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

function getExpenseTypeStatus(tx: IBaseProtocol<any>) {
  return async (groupId: number): Promise<TypeStatus[]> =>
    (
      await tx.manyOrNone<TypeStatus>(
        `
SELECT COUNT(*) as count, SUM(sum) AS sum, type
FROM expenses
WHERE group_id=$/groupId/
GROUP BY type`,
        { groupId }
      )
    ).map(s => ({ ...s, count: parseInt('' + s.count, 10) }));
}

function getInvalidZeroSumRows(tx: IBaseProtocol<any>) {
  return async (groupId: number): Promise<ZeroSumData[]> =>
    (
      await tx.manyOrNone<Record<string, string>>(
        `
SELECT id, zerosum FROM
  (SELECT id, SUM(d.sum) as zerosum
    FROM expenses e
      LEFT JOIN expense_division d ON (e.id = d.expense_id)
    WHERE e.group_id=$/groupId/
    GROUP BY e.id) data
WHERE zerosum <> 0`,
        { groupId }
      )
    ).map(s => ({ id: parseInt(s.id, 10), zerosum: parseInt(s.zerosum, 10) }));
}

export async function getDbStatus(groupId: number): Promise<DbStatus> {
  return db.tx(async tx => {
    return {
      status: await getExpenseTypeStatus(tx)(groupId),
      invalidZerosum: await getInvalidZeroSumRows(tx)(groupId),
      invalidDivision: await getInvalidDivision(tx)(groupId),
    };
  });
}

export default {
  getDbStatus,
};
