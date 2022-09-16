import debug from 'debug';
import { ITask } from 'pg-promise';

import {
  ApiMessage,
  Category,
  CategoryAndTotals,
  CategoryInput,
  InvalidInputError,
  NotFoundError,
} from 'shared/types';
import { Money, partition, toMap } from 'shared/util';

const log = debug('bookkeeper:categories');

function createCategoryObject<T extends Category>(categories: T[]): T[] {
  const [parents, subs] = partition(i => i.parentId === null, categories);
  parents.forEach(p => (p.children = []));
  const parentMap = toMap(parents, 'id');
  subs.forEach(s => parentMap['' + s.parentId].children.push(s));
  return parents;
}

function sumChildTotalsToParent(
  categoryTable: CategoryAndTotals[]
): CategoryAndTotals[] {
  categoryTable.forEach(c => {
    log('Summing childs of', c.id);
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

async function getAll(tx: ITask<any>, groupId: number): Promise<Category[]> {
  const cats = await tx.manyOrNone<Category>(
    `SELECT id, parent_id AS "parentId", name FROM categories
      WHERE group_id=$/groupId/::INTEGER
      ORDER BY (CASE WHEN parent_id IS NULL THEN 1 ELSE 0 END) DESC, parent_id ASC, name
      `,
    { groupId }
  );
  return createCategoryObject(cats);
}

export interface CategoryQueryInput {
  readonly startDate: string;
  readonly endDate: string;
}

async function getTotals(
  tx: ITask<any>,
  groupId: number,
  params: CategoryQueryInput
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
    { groupId, startDate: params.startDate, endDate: params.endDate }
  );
  const categories = createCategoryObject(cats as CategoryAndTotals[]);
  return sumChildTotalsToParent(categories);
}
async function insert(
  tx: ITask<any>,
  groupId: number,
  data: CategoryInput
): Promise<number> {
  log('Creating new category', data);
  return (
    await tx.one<{ id: number }>(
      `INSERT INTO categories (group_id, parent_id, name)
        VALUES ($/groupId/::INTEGER, $/parentId/::INTEGER, $/name/)
        RETURNING id`,
      { groupId, parentId: data.parentId || null, name: data.name }
    )
  ).id;
}

async function getById(
  tx: ITask<any>,
  groupId: number,
  id: number
): Promise<Category> {
  const cat = await tx.oneOrNone<Category>(
    `SELECT id, parent_id as "parentId", name
      FROM categories
      WHERE id=$/id/::INTEGER AND group_id=$/groupId/::INTEGER`,
    { id, groupId }
  );
  if (!cat) {
    throw new NotFoundError('CATEGORY_NOT_FOUND', 'category');
  }
  return cat as Category;
}

async function create(
  tx: ITask<any>,
  groupId: number,
  data: CategoryInput
): Promise<number> {
  if (!data.parentId) {
    return insert(tx, groupId, data);
  }
  const parent = await getById(tx, groupId, data.parentId);
  log('Parent is', parent);
  if (!parent) {
    throw new NotFoundError('CATEGORY_NOT_FOUND', 'category');
  }
  if (parent.parentId !== null && parent.parentId > 0) {
    throw new InvalidInputError(
      'INVALID_PARENT',
      'Sub-category cannot be parent'
    );
  }
  return insert(tx, groupId, data);
}

async function remove(
  tx: ITask<any>,
  groupId: number,
  id: number
): Promise<ApiMessage> {
  await tx.none(
    `DELETE FROM categories
      WHERE id=$/id/::INTEGER AND group_id=$/groupId/::INTEGER`,
    { id, groupId }
  );
  return { status: 'OK', message: 'Category deleted', categoryId: id };
}

async function update(
  tx: ITask<any>,
  groupId: number,
  categoryId: number,
  data: CategoryInput
) {
  const original = await getById(tx, groupId, categoryId);
  if (!original) {
    throw new NotFoundError('CATEGORY_NOT_FOUND', 'category');
  }
  await tx.none(
    `UPDATE categories
      SET parent_id=$/parentId/::INTEGER, name=$/name/
      WHERE id=$/categoryId/::INTEGER AND group_id=$/groupId/::INTEGER`,
    {
      parentId: data.parentId || null,
      name: data.name,
      categoryId,
      groupId,
    }
  );
  return {
    id: categoryId,
    parentId: data.parentId || null,
    name: data.name,
    children: [],
  };
}

async function expandSubCategories(
  tx: ITask<any>,
  groupId: number,
  inputCategoryIds: number[]
) {
  if (inputCategoryIds.length < 1) {
    return [];
  }
  const cats = await tx.manyOrNone<{ id: number }>(
    `SELECT id FROM categories
        WHERE group_id = $/groupId/
        AND id IN ($/ids:csv/) OR parent_id IN ($/ids:csv/)`,
    { ids: inputCategoryIds, groupId }
  );
  return cats.map(c => c.id);
}

export const CategoryDb = {
  getAll,
  getTotals,
  getById,
  create,
  update,
  remove,
  expandSubCategories,
};
