import { db } from '../Db';
import { ExpenseType } from '../../../shared/types/Expense';
import { MoneyLike } from '../../../shared/util/Money';
import { Map } from '../../../shared/util/Objects';
import { InvalidDivision, getInvalidDivision } from './InvalidDivisionQuery';
import { IBaseProtocol } from '../../../../node_modules/pg-promise';

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

export async function getDbStatus(groupId: number): Promise<DbStatus> {
  return db.tx(async tx => {
    return {
      status: await getExpenseTypeStatus(tx)(groupId),
      invalidZerosum: await getInvalidZeroSumRows(tx)(groupId),
      invalidDivision: await getInvalidDivision(tx)(groupId),
    };
  });
}

function getExpenseTypeStatus(tx: IBaseProtocol<any>) {
  return async (groupId: number): Promise<TypeStatus[]> =>
    (await tx.manyOrNone<TypeStatus>(`
SELECT COUNT(*) as count, SUM(sum::NUMERIC) AS sum, type
FROM expenses
WHERE group_id=$/groupId/
GROUP BY type`, { groupId }))
    .map(s => ({ ...s, count: parseInt('' + s.count, 10) }));
}

function getInvalidZeroSumRows(tx: IBaseProtocol<any>) {
  return async (groupId: number): Promise<ZeroSumData[]> =>
    (await tx.manyOrNone<Map<string>>(`
SELECT id, zerosum FROM
  (SELECT id, SUM(d.sum::NUMERIC) as zerosum
    FROM expenses e
      LEFT JOIN expense_division d ON (e.id = d.expense_id)
    WHERE e.group_id=$/groupId/
    GROUP BY e.id) data
WHERE zerosum <> 0`, { groupId }))
    .map(s => ({ id: parseInt(s.id, 10), zerosum: parseInt(s.zerosum, 10) }));
}

export default {
  getDbStatus,
};
