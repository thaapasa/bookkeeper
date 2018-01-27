import { db, DbAccess } from './db';
import Money from '../../shared/util/money';
import { NotFoundError } from '../../shared/types/errors';
import { Category, CategoryAndTotals } from '../../shared/types/session';
import { NumberMap } from '../../shared/util/util';
const debug = require('debug')('bookkeeper:categories');

function createCategoryObject<T extends Category>(categories: T[]): T[] {
    const res: T[] = [];
    const subs: NumberMap<Category> = {};
    debug(categories);
    categories.forEach(c => {
        if (c.parentId === null) {
            c.children = [];
            subs[c.id] = c;
            res.push(c);
        } else {
            subs[c.parentId].children.push(c);
        }
    });
    return res;
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

function getAll(tx: DbAccess) {
    return async (groupId: number): Promise<Category[]> => {
        const cats = await tx.queryList('categories.get_all', 'SELECT id, parent_id, name FROM categories WHERE group_id=$1::INTEGER ' +
            'ORDER BY (CASE WHEN parent_id IS NULL THEN 1 ELSE 0 END) DESC, parent_id ASC, name', [ groupId ]);
        return createCategoryObject(cats as Category[]);
    }
}

export interface CategoryQueryInput {
    readonly startDate: string;
    readonly endDate: string;
};

function getTotals(tx: DbAccess) {
    return async (groupId: number, params: CategoryQueryInput): Promise<CategoryAndTotals[]> => {
        const cats = await tx.queryList('categories.get_totals', 'SELECT categories.id, categories.parent_id, ' +
            "SUM(CASE WHEN type='expense' AND template=false AND date >= $2::DATE AND date < $3::DATE THEN sum::NUMERIC ELSE 0::NUMERIC END) AS expenses, " +
            "SUM(CASE WHEN type='income' AND template=false AND date >= $2::DATE AND date < $3::DATE THEN sum::NUMERIC ELSE 0::NUMERIC END) AS income FROM categories " +
            'LEFT JOIN expenses ON categories.id=category_id WHERE expenses.id IS NULL OR expenses.group_id=$1::INTEGER ' +
            'GROUP BY categories.id, categories.parent_id ' +
            'ORDER BY (CASE WHEN parent_id IS NULL THEN 1 ELSE 0 END) DESC, parent_id ASC, name',
            [ groupId, params.startDate, params.endDate ]);
        const categories = createCategoryObject(cats as CategoryAndTotals[]);
        return sumChildTotalsToParent(categories);
     }
}

export interface CategoryInput {
    readonly parentId?: number;
    readonly name: string;
}

function create(tx: DbAccess) {
    return (groupId: number, data: CategoryInput): Promise<number> => 
        tx.insert("categories.create", "INSERT INTO categories (group_id, parent_id, name) "+
        "VALUES ($1::INTEGER, $2::INTEGER, $3) RETURNING id", [ groupId, data.parentId || null, data.name ]);
}

function getById(tx: DbAccess) {
    return async (groupId: number, id: number): Promise<Category> => {
        const cat = await tx.queryObject('categories.get_by_id',
            'SELECT id, parent_id, name FROM categories WHERE id=$1::INTEGER AND group_id=$2::INTEGER ',
            [ id, groupId ]);
        if (!cat) { throw new NotFoundError('CATEGORY_NOT_FOUND', 'category'); }
        return cat as Category;
    }
}

function update(groupId: number, categoryId: number, data: CategoryInput) {
    return db.transaction(async (tx): Promise<Category> => {
        const original = await getById(tx)(groupId, categoryId);
        if (!original) { throw new NotFoundError('CATEGORY_NOT_FOUND', 'category'); }
        await tx.update('categories.update',
            'UPDATE categories SET parent_id=$1::INTEGER, name=$2 WHERE id=$3::INTEGER AND group_id=$4::INTEGER',
            [data.parentId || null, data.name, categoryId, groupId]);
        return { id: categoryId, parentId: data.parentId || null, name: data.name, children: [] };
    }, false);
}

export default {
    getAll: getAll(db),
    getTotals: getTotals(db),
    getById: getById(db),
    create: create(db),
    update: update,
    tx: {
        getAll: getAll,
        getById: getById
    }
};
