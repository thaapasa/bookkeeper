import { ExpenseType } from '../../../shared/types/Expense';
import { MoneyLike } from '../../../shared/util/Money';
import { IBaseProtocol } from '../../../../node_modules/pg-promise';

export interface InvalidDivision {
  id: number;
  type: ExpenseType;
  sum: MoneyLike;
  positive: MoneyLike;
  negative: MoneyLike;
  zero: MoneyLike;
}

export function getInvalidDivision(tx: IBaseProtocol<any>) {
  return async (groupId: number): Promise<InvalidDivision[]> =>
    tx.manyOrNone<InvalidDivision>(`
SELECT *
FROM (
  SELECT
    data.id,
    data.type,
    data.sum,
    (CASE data.type
    WHEN 'expense'
      THEN data.benefit
    WHEN 'income'
      THEN data.income
    WHEN 'transfer'
      THEN data.transferee
    ELSE '0.00' :: NUMERIC END) AS positive,
    (CASE data.type
    WHEN 'expense'
      THEN data.cost
    WHEN 'income'
      THEN data.split
    WHEN 'transfer'
      THEN data.transferor
    ELSE '0.00' :: NUMERIC END) AS negative,
    (CASE data.type
    WHEN 'expense'
      THEN data.income + data.split + data.transferee + data.transferor
    WHEN 'income'
      THEN data.benefit + data.cost + data.transferee + data.transferor
    WHEN 'transfer'
      THEN data.income + data.split + data.benefit + data.cost
    ELSE '0.00' :: NUMERIC END) AS zero
  FROM (
    SELECT
      MIN(id)         AS id,
      MIN(type)       AS type,
      MIN(sum)        AS sum,
      SUM(cost)       AS cost,
      SUM(benefit)    AS benefit,
      SUM(income)     AS income,
      SUM(split)      AS split,
      SUM(transferor) AS transferor,
      SUM(transferee) AS transferee
    FROM (
      SELECT
        id,
        date :: DATE,
        receiver,
        e.type,
        e.sum :: MONEY :: NUMERIC,
        title,
        description,
        confirmed,
        source_id,
        e.user_id,
        created_by_id,
        group_id,
        category_id,
        created,
        recurring_expense_id,
        (CASE WHEN d.type = 'cost'
          THEN d.sum :: NUMERIC
        ELSE '0.00' :: NUMERIC END) AS cost,
        (CASE WHEN d.type = 'benefit'
          THEN d.sum :: NUMERIC
        ELSE '0.00' :: NUMERIC END) AS benefit,
        (CASE WHEN d.type = 'income'
          THEN d.sum :: NUMERIC
        ELSE '0.00' :: NUMERIC END) AS income,
        (CASE WHEN d.type = 'split'
          THEN d.sum :: NUMERIC
        ELSE '0.00' :: NUMERIC END) AS split,
        (CASE WHEN d.type = 'transferor'
          THEN d.sum :: NUMERIC
        ELSE '0.00' :: NUMERIC END) AS transferor,
        (CASE WHEN d.type = 'transferee'
          THEN d.sum :: NUMERIC
        ELSE '0.00' :: NUMERIC END) AS transferee
      FROM expenses e
        LEFT JOIN expense_division d ON (d.expense_id = e.id)
        WHERE group_id=$/groupId/
    ) breakdown
    GROUP BY id
  ) data
  ORDER BY data.id) overview
WHERE sum <> positive OR sum <> -negative OR zero <> 0`, { groupId });
}
