import { ITask } from 'pg-promise';

import { ExpenseGrouping, ExpenseGroupingData, isDefined, ObjectId } from 'shared/types';
import { groupingImageHandler } from 'server/content/GroupingImage';

import { dbMain } from '../Db';

const GROUPING_FIELDS = /*sql*/ `eg.id, eg.title, eg.created, eg.updated, eg.image, ARRAY_AGG(egc.category_id) AS categories`;

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
      ORDER BY eg.sort_order
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
      ORDER BY eg.sort_order
    `,
    { groupingId, groupId },
  );
  return row ? toExpenseGrouping(row) : undefined;
}

export async function insertExpenseGrouping(
  tx: ITask<any>,
  groupId: ObjectId,
  data: ExpenseGroupingData,
): Promise<ObjectId> {
  const row = await tx.one(
    `INSERT INTO expense_groupings
      (group_id, title)
      VALUES ($/groupId/, $/title/)
      RETURNING id`,
    { groupId, title: data.title },
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
      SET title=$/title/
      WHERE id=$/groupingId/`,
    { groupingId, title: data.title },
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
    image: row.image ? groupingImageHandler.getVariant('image', row.image).webPath : undefined,
  };
}
