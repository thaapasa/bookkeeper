import { ITask } from 'pg-promise';

import {
  ApiMessage,
  Category,
  CategoryAndTotals,
  CategoryInput,
  InvalidInputError,
  NotFoundError,
  ObjectId,
} from 'shared/types';
import { Money, partition, toMap } from 'shared/util';
import { logger } from 'server/Logger';

const CATEGORY_FIELDS = /*sql*/ `c.id, c.parent_id AS "parentId", c.name, p.name AS "parentName"`;

interface CategoryRow {
  id: ObjectId;
  parentId: ObjectId | null;
  name: string;
  parentName: string | null;
}

export async function getAllCategories(tx: ITask<any>, groupId: number): Promise<Category[]> {
  const cats = await tx.manyOrNone<CategoryRow>(
    `SELECT ${CATEGORY_FIELDS}
      FROM categories c
      LEFT JOIN categories p ON (p.id = c.parent_id)
      WHERE c.group_id=$/groupId/
      ORDER BY (CASE WHEN c.parent_id IS NULL THEN 1 ELSE 0 END) DESC, 
        c.parent_id ASC, c.name ASC`,
    { groupId },
  );
  return createCategoryObject(cats.map(rowToCategory));
}

export interface CategoryQueryInput {
  readonly startDate: string;
  readonly endDate: string;
}

export async function getCategoryTotals(
  tx: ITask<any>,
  groupId: number,
  params: CategoryQueryInput,
): Promise<CategoryAndTotals[]> {
  const cats = await tx.manyOrNone<CategoryAndTotals>(
    `SELECT categories.id, categories.parent_id as "parentId",
        SUM(CASE WHEN type='expense' AND template=false AND date >= $/startDate/::DATE AND date <= $/endDate/::DATE THEN sum ELSE 0::NUMERIC END) AS expenses,
        SUM(CASE WHEN type='income' AND template=false AND date >= $/startDate/::DATE AND date <= $/endDate/::DATE THEN sum ELSE 0::NUMERIC END) AS income
      FROM categories
      LEFT JOIN expenses ON categories.id = category_id
      WHERE categories.group_id = $/groupId/
        AND (expenses.id IS NULL OR expenses.group_id = $/groupId/::INTEGER)
      GROUP BY categories.id, categories.parent_id
      ORDER BY (CASE WHEN parent_id IS NULL THEN 1 ELSE 0 END) DESC, parent_id ASC, name`,
    { groupId, startDate: params.startDate, endDate: params.endDate },
  );
  const categories = createCategoryObject(cats as CategoryAndTotals[]);
  return sumChildTotalsToParent(categories);
}
async function insert(tx: ITask<any>, groupId: number, data: CategoryInput): Promise<number> {
  logger.debug(data, 'Creating new category');
  return (
    await tx.one<{ id: number }>(
      `INSERT INTO categories (group_id, parent_id, name)
        VALUES ($/groupId/::INTEGER, $/parentId/::INTEGER, $/name/)
        RETURNING id`,
      { groupId, parentId: data.parentId || null, name: data.name },
    )
  ).id;
}

export async function getCategoryById(
  tx: ITask<any>,
  groupId: number,
  categoryId: number,
): Promise<Category> {
  const cat = await tx.oneOrNone<CategoryRow>(
    `SELECT ${CATEGORY_FIELDS}
      FROM categories c
      LEFT JOIN categories p ON (p.id = c.parent_id)
      WHERE c.id=$/categoryId/ AND c.group_id=$/groupId/`,
    { categoryId, groupId },
  );
  if (!cat) {
    throw new NotFoundError('CATEGORY_NOT_FOUND_1', 'category', categoryId);
  }
  return rowToCategory(cat);
}

export async function getCategoriesById(
  tx: ITask<any>,
  groupId: number,
  ...categoryIds: number[]
): Promise<Category[]> {
  if (!categoryIds.length) {
    return [];
  }
  const cats = await tx.manyOrNone<CategoryRow>(
    `SELECT ${CATEGORY_FIELDS}
      FROM categories c
      LEFT JOIN categories p ON (p.id = c.parent_id)
      WHERE c.id IN ($/categoryIds:csv/) AND c.group_id=$/groupId/`,
    { categoryIds, groupId },
  );
  return cats.map(rowToCategory);
}

export async function createCategory(
  tx: ITask<any>,
  groupId: number,
  data: CategoryInput,
): Promise<number> {
  if (!data.parentId) {
    return insert(tx, groupId, data);
  }
  const parent = await getCategoryById(tx, groupId, data.parentId);
  logger.debug(parent, 'Parent is');
  if (!parent) {
    throw new NotFoundError('CATEGORY_NOT_FOUND', 'category');
  }
  if (parent.parentId !== null && parent.parentId > 0) {
    throw new InvalidInputError('INVALID_PARENT', 'Sub-category cannot be parent');
  }
  return insert(tx, groupId, data);
}

export async function deleteCategory(
  tx: ITask<any>,
  groupId: number,
  categoryId: number,
): Promise<ApiMessage> {
  const category = await getCategoryById(tx, groupId, categoryId);
  if (!category) {
    throw new NotFoundError('CATEGORY_NOT_FOUND', 'category', categoryId);
  }

  await tx.one(
    `DELETE FROM categories
      WHERE id=$/categoryId/ AND group_id=$/groupId/
      RETURNING id`,
    { categoryId, groupId },
  );
  logger.info(category, `Deleted category`);
  return { status: 'OK', message: 'Category deleted', categoryId };
}

export async function updateCategory(
  tx: ITask<any>,
  groupId: number,
  categoryId: number,
  data: CategoryInput,
): Promise<Category> {
  const original = await getCategoryById(tx, groupId, categoryId);
  if (!original) {
    throw new NotFoundError('CATEGORY_NOT_FOUND', 'category', categoryId);
  }
  logger.info({ data }, `Updating category ${categoryId}`);
  await tx.none(
    `UPDATE categories
      SET parent_id=$/parentId/::INTEGER, name=$/name/
      WHERE id=$/categoryId/::INTEGER AND group_id=$/groupId/::INTEGER`,
    {
      parentId: data.parentId || null,
      name: data.name,
      categoryId,
      groupId,
    },
  );
  return getCategoryById(tx, groupId, categoryId);
}

export async function expandSubCategories(
  tx: ITask<any>,
  groupId: number,
  inputCategoryIds: number[],
) {
  if (inputCategoryIds.length < 1) {
    return [];
  }
  const cats = await tx.manyOrNone<{ id: number }>(
    `SELECT id FROM categories
        WHERE group_id = $/groupId/
        AND id IN ($/ids:csv/) OR parent_id IN ($/ids:csv/)`,
    { ids: inputCategoryIds, groupId },
  );
  return cats.map(c => c.id);
}

function createCategoryObject<T extends Category>(categories: T[]): T[] {
  const [parents, subs] = partition(i => i.parentId === null, categories);
  parents.forEach(p => (p.children = []));
  const parentMap = toMap(parents, 'id');
  subs.forEach(s => (parentMap['' + s.parentId].children ??= []).push(s));
  return parents;
}

function rowToCategory(c: CategoryRow): Category {
  return {
    ...c,
    parentName: c.parentName ?? undefined,
    fullName: c.parentName ? `${c.parentName} - ${c.name}` : c.name,
  };
}

function sumChildTotalsToParent(categoryTable: CategoryAndTotals[]): CategoryAndTotals[] {
  categoryTable.forEach(c => {
    if (c.parentId === null) {
      let expenseSum = Money.from(c.expenses);
      let incomeSum = Money.from(c.income);
      c.children.forEach(ch => {
        expenseSum = expenseSum.plus(ch.expenses);
        incomeSum = incomeSum.plus(ch.income);
      });
      c.totalExpenses = expenseSum.toString();
      c.totalIncome = incomeSum.toString();
    }
  });
  return categoryTable;
}
