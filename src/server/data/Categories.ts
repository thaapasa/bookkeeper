import { db } from './Db';
import Money from '../../shared/util/Money';
import { NotFoundError } from '../../shared/types/Errors';
import { Category, CategoryAndTotals } from '../../shared/types/Session';
import { partition, toMap } from '../../shared/util/Arrays';
import { IBaseProtocol } from '../../../node_modules/pg-promise';
const debug = require('debug')('bookkeeper:categories');

function createCategoryObject<T extends Category>(categories: T[]): T[] {
  const [parents, subs] = partition(i => i.parentId === null, categories);
  parents.forEach(p => p.children = []);
  const parentMap = toMap(parents, 'id');
  subs.forEach(s => parentMap['' + s.parentId].children.push(s));
  return parents;
}

function sumChildTotalsToParent(categoryTable: CategoryAndTotals[]): CategoryAndTotals[] {
  categoryTable.forEach(c => {
    debug('Summing childs of', c.id);
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

function getAll(tx: IBaseProtocol<any>) {
  return async (groupId: number): Promise<Category[]> => {
    const cats = await tx.manyOrNone<Category>(`
SELECT id, parent_id AS "parentId", name FROM categories
WHERE group_id=$/groupId/::INTEGER
ORDER BY (CASE WHEN parent_id IS NULL THEN 1 ELSE 0 END) DESC, parent_id ASC, name
      `, { groupId });
    return createCategoryObject(cats);
  };
}

export interface CategoryQueryInput {
  readonly startDate: string;
  readonly endDate: string;
}

function getTotals(tx: IBaseProtocol<any>) {
  return async (groupId: number, params: CategoryQueryInput): Promise<CategoryAndTotals[]> => {
    const cats = await tx.manyOrNone<CategoryAndTotals>(`
SELECT
  categories.id, categories.parent_id as "parentId",
  SUM(CASE WHEN type='expense' AND template=false AND date >= $/startDate/::DATE AND date < $/endDate/::DATE THEN sum::NUMERIC ELSE 0::NUMERIC END) AS expenses,
  SUM(CASE WHEN type='income' AND template=false AND date >= $/startDate/::DATE AND date < $/endDate/::DATE THEN sum::NUMERIC ELSE 0::NUMERIC END) AS income
FROM categories
LEFT JOIN expenses ON categories.id = category_id
WHERE categories.group_id = $/groupId/
  AND (expenses.id IS NULL OR expenses.group_id = $/groupId/::INTEGER)
GROUP BY categories.id, categories.parent_id
ORDER BY (CASE WHEN parent_id IS NULL THEN 1 ELSE 0 END) DESC, parent_id ASC, name`,
      { groupId, startDate: params.startDate, endDate: params.endDate });
    const categories = createCategoryObject(cats as CategoryAndTotals[]);
    return sumChildTotalsToParent(categories);
  };
}

export interface CategoryInput {
  readonly parentId?: number;
  readonly name: string;
}

function create(tx: IBaseProtocol<any>) {
  return (groupId: number, data: CategoryInput): Promise<number> =>
    tx.one<number>(`
INSERT INTO categories (group_id, parent_id, name)
VALUES ($/groupId/::INTEGER, $/parentId/::INTEGER, $/name/)
RETURNING id`,
      { groupId, parentId: data.parentId || null, name: data.name });
}

function getById(tx: IBaseProtocol<any>) {
  return async (groupId: number, id: number): Promise<Category> => {
    const cat = await tx.oneOrNone<Category>(`
SELECT id, parent_id, name FROM categories
WHERE id=$/id/::INTEGER AND group_id=$/groupId/::INTEGER`,
      { id, groupId });
    if (!cat) { throw new NotFoundError('CATEGORY_NOT_FOUND', 'category'); }
    return cat as Category;
  };
}

function update(groupId: number, categoryId: number, data: CategoryInput) {
  return db.tx(async (tx): Promise<Category> => {
    const original = await getById(tx)(groupId, categoryId);
    if (!original) { throw new NotFoundError('CATEGORY_NOT_FOUND', 'category'); }
    await tx.none(`
UPDATE categories
SET parent_id=$/parentId/::INTEGER, name=$/name/
WHERE id=$/categoryId/::INTEGER AND group_id=$/groupId/::INTEGER`,
      { parentId: data.parentId || null, name: data.name, categoryId, groupId });
    return { id: categoryId, parentId: data.parentId || null, name: data.name, children: [] };
  });
}

export default {
  getAll: getAll(db),
  getTotals: getTotals(db),
  getById: getById(db),
  create: create(db),
  update,
  tx: {
    getAll,
    getById,
  },
};
