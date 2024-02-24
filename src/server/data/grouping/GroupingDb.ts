import { ITask } from 'pg-promise';

import { UserExpense } from 'shared/expense';
import { toISODate } from 'shared/time';
import {
  ExpenseGrouping,
  ExpenseGroupingData,
  ExpenseGroupingRef,
  isDefined,
  ObjectId,
} from 'shared/types';
import { groupingImageHandler } from 'server/content/GroupingImage';

import { dbRowToExpense, expenseSelectClause } from '../BasicExpenseDb';
import { dbMain } from '../Db';

const GROUPING_FIELDS = /*sql*/ `eg.id, eg.title,
  eg.start_date AS "startDate", eg.end_date AS "endDate",
  eg.created, eg.updated, eg.image,
  ARRAY_AGG(egc.category_id) AS categories`;

export async function getExpenseGroupingsForUser(
  tx: ITask<any>,
  groupId: ObjectId,
): Promise<ExpenseGrouping[]> {
  const rows = await tx.manyOrNone(
    `SELECT ${GROUPING_FIELDS}
      FROM expense_groupings eg
      LEFT JOIN expense_grouping_categories egc ON (eg.id = egc.expense_grouping_id)
      WHERE eg.group_id=$/groupId/
      GROUP BY eg.id
      ORDER BY eg.start_date, eg.title
    `,
    { groupId },
  );
  return rows.map(toExpenseGrouping);
}

export async function getExpenseGroupingById(
  tx: ITask<any>,
  groupId: ObjectId,
  groupingId: ObjectId,
): Promise<ExpenseGrouping | undefined> {
  const row = await tx.oneOrNone(
    `SELECT ${GROUPING_FIELDS}
      FROM expense_groupings eg
      LEFT JOIN expense_grouping_categories egc ON (eg.id = egc.expense_grouping_id)
      WHERE eg.id=$/groupingId/ AND group_id=$/groupId/
      GROUP BY eg.id
      ORDER BY eg.start_date, eg.title
    `,
    { groupingId, groupId },
  );
  return row ? toExpenseGrouping(row) : undefined;
}

export async function getAllGroupingRefs(
  tx: ITask<any>,
  groupId: ObjectId,
): Promise<ExpenseGroupingRef[]> {
  const rows = await tx.manyOrNone(
    `SELECT eg.id, eg.title, eg.image
      FROM expense_groupings eg
      WHERE eg.group_id=$/groupId/
      GROUP BY eg.id
      ORDER BY eg.start_date, eg.title
    `,
    { groupId },
  );
  return rows.map(toExpenseGroupingRef);
}

export async function insertExpenseGrouping(
  tx: ITask<any>,
  groupId: ObjectId,
  data: ExpenseGroupingData,
): Promise<ObjectId> {
  const row = await tx.one(
    `INSERT INTO expense_groupings
      (group_id, title, start_date, end_date)
      VALUES ($/groupId/, $/title/, $/startDate/, $/endDate/)
      RETURNING id`,
    { groupId, title: data.title, startDate: data.startDate, endDate: data.endDate },
  );
  const id = row.id;
  if (data.categories.length > 0) {
    await tx.none(
      dbMain.helpers.insert(
        data.categories.map(c => ({ expense_grouping_id: id, category_id: c })),
        ['expense_grouping_id', 'category_id'],
        'expense_grouping_categories',
      ),
    );
  }
  return id;
}

export async function updateExpenseGroupingById(
  tx: ITask<any>,
  groupingId: ObjectId,
  data: ExpenseGroupingData,
): Promise<void> {
  await tx.none(
    `UPDATE expense_groupings
      SET title=$/title/, start_date=$/startDate/, end_date=$/endDate/, updated=NOW()
      WHERE id=$/groupingId/`,
    { groupingId, title: data.title, startDate: data.startDate, endDate: data.endDate },
  );
  await tx.none(`DELETE FROM expense_grouping_categories WHERE expense_grouping_id=$/groupingId/`, {
    groupingId,
  });
  if (data.categories.length > 0) {
    await tx.none(
      dbMain.helpers.insert(
        data.categories.map(c => ({ expense_grouping_id: groupingId, category_id: c })),
        ['expense_grouping_id', 'category_id'],
        'expense_grouping_categories',
      ),
    );
  }
}

export async function getExpensesForGrouping(
  tx: ITask<any>,
  groupId: ObjectId,
  userId: ObjectId,
  groupingId: ObjectId,
): Promise<UserExpense[]> {
  const rows = await tx.manyOrNone(
    expenseSelectClause(/*sql*/ `
      LEFT JOIN categories cat ON (cat.id = e.category_id)
      LEFT JOIN expense_grouping_categories egc ON (egc.category_id = cat.id OR egc.category_id = cat.parent_id)
      LEFT JOIN expense_groupings eg ON (eg.id = egc.expense_grouping_id)
      WHERE e.group_id=$/groupId/
      AND (
        (
          e.grouping_id IS NULL
          AND egc.expense_grouping_id = $/groupingId/
          AND (eg.start_date IS NULL OR eg.start_date <= e.date)
          AND (eg.end_date IS NULL OR eg.end_date >= e.date)
        )
        OR (e.grouping_id = $/groupingId/)
      )
    `),
    { userId, groupId, groupingId },
  );
  return rows.map(dbRowToExpense);
}

export async function deleteExpenseGroupingById(
  tx: ITask<any>,
  groupingId: ObjectId,
): Promise<void> {
  await tx.none(
    `DELETE FROM expense_groupings
      WHERE id=$/groupingId/`,
    { groupingId },
  );
}

export async function setGroupingImageById(
  tx: ITask<any>,
  groupingId: ObjectId,
  image: string,
): Promise<void> {
  await tx.none(
    `UPDATE expense_groupings
      SET image=$/image/
      WHERE id=$/groupingId/`,
    { groupingId, image },
  );
}

export async function clearGroupingImageById(tx: ITask<any>, groupingId: ObjectId): Promise<void> {
  await tx.none(
    `UPDATE expense_groupings
      SET image=NULL
      WHERE id=$/groupingId/`,
    { groupingId },
  );
}

function toExpenseGrouping(row: any): ExpenseGrouping {
  return {
    id: row.id,
    title: row.title,
    categories: (row.categories ?? []).filter(isDefined),
    startDate: row.startDate ? toISODate(row.startDate) : undefined,
    endDate: row.endDate ? toISODate(row.endDate) : undefined,
    image: row.image ? groupingImageHandler.getVariant('image', row.image).webPath : undefined,
  };
}

function toExpenseGroupingRef(row: any): ExpenseGroupingRef {
  return {
    id: row.id,
    title: row.title,
    image: row.image ? groupingImageHandler.getVariant('image', row.image).webPath : undefined,
  };
}
