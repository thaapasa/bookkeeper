import { ITask } from 'pg-promise';

import { UserExpense } from 'shared/expense';
import { toISODate } from 'shared/time';
import {
  ExpenseGrouping,
  ExpenseGroupingCategoryTotal,
  ExpenseGroupingData,
  ExpenseGroupingRef,
  isDefined,
  ObjectId,
} from 'shared/types';
import { groupingImageHandler } from 'server/content/GroupingImage';

import { dbRowToExpense, expenseSelectClause } from '../BasicExpenseDb';
import { dbMain } from '../Db';

const GROUPING_ORDER = /*sql*/ `eg.start_date DESC NULLS LAST, eg.title`;

const GROUPING_FIELDS = /*sql*/ `eg.id, eg.title,
  eg.start_date AS "startDate", eg.end_date AS "endDate",
  eg.created, eg.updated, eg.image, eg.color, eg.tags, eg.private, eg.only_own as "onlyOwn",
  ARRAY_AGG(egc.category_id) AS categories`;

const EXPENSE_SUM_SUBSELECT = /*sql*/ `
  SELECT SUM(CASE e.type WHEN 'expense' THEN sum WHEN 'income' THEN -sum ELSE 0 END)
    FROM expenses e
    LEFT JOIN categories cat ON (cat.id = e.category_id)
    WHERE e.grouping_id = data.id
    OR (
      e.grouping_id IS NULL
      AND (cat.id = ANY(data.categories) OR cat.parent_id = ANY(data.categories))
      AND (data."startDate" IS NULL OR e.date >= data."startDate")
      AND (data."endDate" IS NULL OR e.date <= data."endDate")
      AND (data."onlyOwn" IS FALSE OR e.user_id = $/userId/)
    )
`;

const EXPENSE_JOIN_TO_GROUPING = /*sql*/ `
  WHERE e.group_id=$/groupId/
  AND (
    (e.grouping_id IS NULL AND eg.id = $/groupingId/)
    OR (e.grouping_id = $/groupingId/)
  )
`;

export async function getExpenseGroupingsForUser(
  tx: ITask<any>,
  groupId: ObjectId,
  userId: ObjectId,
): Promise<ExpenseGrouping[]> {
  const rows = await tx.manyOrNone(
    `SELECT data.*, (${EXPENSE_SUM_SUBSELECT}) AS "totalSum" FROM (
      SELECT ${GROUPING_FIELDS}
        FROM expense_groupings eg
        LEFT JOIN expense_grouping_categories egc ON (eg.id = egc.expense_grouping_id)
        WHERE eg.group_id=$/groupId/ AND (eg.private IS FALSE OR eg.user_id = $/userId/)
        GROUP BY eg.id
        ORDER BY ${GROUPING_ORDER}
    ) data
    `,
    { groupId, userId },
  );
  return rows.map(toExpenseGrouping);
}

export async function getExpenseGroupingsTags(
  tx: ITask<any>,
  groupId: ObjectId,
): Promise<string[]> {
  const rows = await tx.manyOrNone(
    `SELECT DISTINCT UNNEST(tags) AS tag
      FROM expense_groupings
      WHERE group_id = $/groupId/
      ORDER BY tag
    `,
    { groupId },
  );
  return rows.map(r => r.tag);
}

export async function getExpenseGroupingById(
  tx: ITask<any>,
  groupId: ObjectId,
  userId: ObjectId,
  groupingId: ObjectId,
): Promise<ExpenseGrouping | undefined> {
  const row = await tx.oneOrNone(
    `SELECT data.*, (${EXPENSE_SUM_SUBSELECT}) AS "totalSum" FROM (
      SELECT ${GROUPING_FIELDS}
        FROM expense_groupings eg
        LEFT JOIN expense_grouping_categories egc ON (eg.id = egc.expense_grouping_id)
        WHERE eg.id=$/groupingId/ AND group_id=$/groupId/ AND (eg.private IS FALSE OR eg.user_id = $/userId/)
        GROUP BY eg.id
        ORDER BY ${GROUPING_ORDER}
    ) data
    `,
    { groupingId, groupId, userId },
  );
  return row ? toExpenseGrouping(row) : undefined;
}

export async function getAllGroupingRefs(
  tx: ITask<any>,
  groupId: ObjectId,
): Promise<ExpenseGroupingRef[]> {
  const rows = await tx.manyOrNone(
    `SELECT eg.id, eg.title, eg.image, eg.color, eg.tags, eg.private, eg.only_own AS "onlyOwn"
      FROM expense_groupings eg
      WHERE eg.group_id=$/groupId/
      GROUP BY eg.id
      ORDER BY ${GROUPING_ORDER}
    `,
    { groupId },
  );
  return rows.map(toExpenseGroupingRef);
}

export async function insertExpenseGrouping(
  tx: ITask<any>,
  groupId: ObjectId,
  userId: ObjectId,
  data: ExpenseGroupingData,
): Promise<ObjectId> {
  const row = await tx.one(
    `INSERT INTO expense_groupings
      (group_id, user_id, title, start_date, end_date, color, tags, private, only_own)
      VALUES ($/groupId/, $/userId/, $/title/, $/startDate/, $/endDate/, $/color/, $/tags/::TEXT[], $/private/, $/onlyOwn/)
      RETURNING id`,
    {
      groupId,
      userId,
      title: data.title,
      startDate: data.startDate,
      endDate: data.endDate,
      color: data.color ?? '',
      tags: data.tags ?? [],
      private: data.private,
      onlyOwn: data.onlyOwn,
    },
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
      SET title=$/title/, start_date=$/startDate/, end_date=$/endDate/, color=$/color/,
        tags=$/tags/, private=$/private/, only_own=$/onlyOwn/, updated=NOW()
      WHERE id=$/groupingId/`,
    {
      groupingId,
      title: data.title,
      startDate: data.startDate,
      endDate: data.endDate,
      color: data.color ?? '',
      tags: data.tags ?? [],
      private: data.private,
      onlyOwn: data.onlyOwn,
    },
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
  const rows = await tx.manyOrNone(expenseSelectClause(EXPENSE_JOIN_TO_GROUPING), {
    userId,
    groupId,
    groupingId,
  });
  return rows.map(dbRowToExpense);
}

export async function getCategoryTotalsForGrouping(
  tx: ITask<any>,
  groupId: ObjectId,
  userId: ObjectId,
  groupingId: ObjectId,
): Promise<ExpenseGroupingCategoryTotal[]> {
  const rows = await tx.manyOrNone(
    `SELECT SUM(CASE e.type WHEN 'expense' THEN sum WHEN 'income' THEN -sum ELSE 0 END), e.category_id, cat.name
      FROM expenses e
      LEFT JOIN categories cat ON (cat.id = e.category_id)
      LEFT JOIN expense_groupings eg ON ((eg.id = e.grouping_id) OR (
        eg.group_id = e.group_id
        AND eg.id IN (
          SELECT expense_grouping_id FROM expense_grouping_categories egc WHERE egc.category_id IN (cat.id, cat.parent_id)
            AND (eg.start_date IS NULL OR eg.start_date <= e.date)
            AND (eg.end_date IS NULL OR eg.end_date >= e.date)
            AND (eg.only_own IS FALSE or e.user_id=$/userId/)
        ))
      )
      ${EXPENSE_JOIN_TO_GROUPING}
      GROUP BY e.category_id, cat.name;
    `,
    { groupId, userId, groupingId },
  );
  return rows.map(toExpenseGroupingCategoryTotal);
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
    color: row.color,
    tags: row.tags,
    private: row.private,
    onlyOwn: row.onlyOwn,
    categories: (row.categories ?? []).filter(isDefined),
    startDate: row.startDate ? toISODate(row.startDate) : undefined,
    endDate: row.endDate ? toISODate(row.endDate) : undefined,
    totalSum: row.totalSum ?? '0',
    image: row.image ? groupingImageHandler.getVariant('image', row.image).webPath : undefined,
  };
}

function toExpenseGroupingRef(row: any): ExpenseGroupingRef {
  return {
    id: row.id,
    title: row.title,
    color: row.color,
    tags: row.tags,
    image: row.image ? groupingImageHandler.getVariant('image', row.image).webPath : undefined,
    private: row.private,
    onlyOwn: row.onlyOwn,
  };
}

function toExpenseGroupingCategoryTotal(row: any): ExpenseGroupingCategoryTotal {
  return {
    categoryId: row.category_id,
    title: row.name,
    sum: row.sum ?? '0',
  };
}
