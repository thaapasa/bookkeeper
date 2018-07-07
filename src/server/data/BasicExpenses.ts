import { db } from './Db';
import { Moment } from 'moment';
import * as time from '../../shared/util/Time';
import Money, { MoneyLike } from '../../shared/util/Money';
import categories from './Categories';
import users from './Users';
import sources from './Sources';
import { determineDivision } from './ExpenseDivision';
import { NotFoundError } from '../../shared/types/Errors';
import { Expense, UserExpense, ExpenseDivisionType, ExpenseDivisionItem, ExpenseStatus } from '../../shared/types/Expense';
import { ApiMessage } from '../../shared/types/Api';
import { IBaseProtocol } from '../../../node_modules/pg-promise';
const debug = require('debug')('bookkeeper:api:expenses');

function expenseSelect(where: string): string {
  return `
SELECT
  MIN(id) AS id, MIN(date) AS date, MIN(receiver) AS receiver, MIN(type) AS type, MIN(sum) AS sum,
  MIN(title) AS title, MIN(description) AS description, BOOL_AND(confirmed) AS confirmed, MIN(source_id) AS "sourceId",
  MIN(user_id) AS "userId", MIN(created_by_id) AS "createdById", MIN(group_id) AS "groupId", MIN(category_id) AS "categoryId",
  MIN(created) AS created, MIN(recurring_expense_id) AS "recurringExpenseId",
  SUM(cost) AS "userCost", SUM(benefit) AS "userBenefit", SUM(income) AS "userIncome", SUM(split) AS "userSplit",
  SUM(transferor) AS "userTransferor", SUM(transferee) AS "userTransferee",
  SUM(cost + benefit + income + split + transferor + transferee) AS "userValue"
FROM (
  SELECT
    id, date::DATE, receiver, e.type, e.sum::MONEY::NUMERIC, title, description, confirmed,
    source_id, e.user_id, created_by_id, group_id, category_id, created, recurring_expense_id,
    (CASE WHEN d.type = 'cost' THEN d.sum::NUMERIC ELSE '0.00'::NUMERIC END) AS cost,
    (CASE WHEN d.type = 'benefit' THEN d.sum::NUMERIC ELSE '0.00'::NUMERIC END) AS benefit,
    (CASE WHEN d.type = 'income' THEN d.sum::NUMERIC ELSE '0.00'::NUMERIC END) AS income,
    (CASE WHEN d.type = 'split' THEN d.sum::NUMERIC ELSE '0.00'::NUMERIC END) AS split,
    (CASE WHEN d.type = 'transferor' THEN d.sum::NUMERIC ELSE '0.00'::NUMERIC END) AS transferor,
    (CASE WHEN d.type = 'transferee' THEN d.sum::NUMERIC ELSE '0.00'::NUMERIC END) AS transferee
  FROM expenses e
  LEFT JOIN expense_division d ON (d.expense_id = e.id AND d.user_id = $/userId/)
  ${where}
) breakdown
GROUP BY id ORDER BY date ASC, title ASC, id
`;
}

const countTotalSelect = `
SELECT
  COALESCE(SUM(benefit), '0.00'::NUMERIC) as benefit,
  COALESCE(SUM(cost), '0.00'::NUMERIC) AS cost,
  COALESCE(SUM(income), '0.00'::NUMERIC) AS income,
  COALESCE(SUM(split), '0.00'::NUMERIC) AS split,
  COALESCE(SUM(transferor), '0.00'::NUMERIC) AS transferor,
  COALESCE(SUM(transferee), '0.00'::NUMERIC) AS transferee
FROM (
  SELECT
    (CASE WHEN d.type = 'cost' THEN d.sum::NUMERIC ELSE '0.00'::NUMERIC END) AS cost,
    (CASE WHEN d.type = 'benefit' THEN d.sum::NUMERIC ELSE '0.00'::NUMERIC END) AS benefit,
    (CASE WHEN d.type = 'income' THEN d.sum::NUMERIC ELSE '0.00'::NUMERIC END) AS income,
    (CASE WHEN d.type = 'split' THEN d.sum::NUMERIC ELSE '0.00'::NUMERIC END) AS split,
    (CASE WHEN d.type = 'transferor' THEN d.sum::NUMERIC ELSE '0.00'::NUMERIC END) AS transferor,
    (CASE WHEN d.type = 'transferee' THEN d.sum::NUMERIC ELSE '0.00'::NUMERIC END) AS transferee
  FROM expenses e
  LEFT JOIN expense_division d ON (d.expense_id = e.id AND d.user_id = $/userId/::INTEGER)
  WHERE group_id=$/groupId/::INTEGER AND template=false AND date >= $/startDate/::DATE AND date < $/endDate/::DATE
) breakdown
`;

function getAll(tx: IBaseProtocol<any>) {
  return async (groupId: number, userId: number): Promise<Expense[]> => {
    const expenses = await tx.manyOrNone<UserExpense>(
      expenseSelect(`WHERE group_id=$/groupId/`),
      { userId, groupId },
    );
    return expenses.map(mapExpense);
  };
}

function mapExpense(e: UserExpense): UserExpense {
  if (e === undefined) { throw new NotFoundError('EXPENSE_NOT_FOUND', 'expense'); }
  e.date = time.toMoment(e.date).format('YYYY-MM-DD');
  e.userBalance = Money.from(e.userValue).negate().toString();
  return e;
}

function countTotalBetween(tx: IBaseProtocol<any>) {
  return async (groupId: number, userId: number, startDate: string | Moment, endDate: string | Moment): Promise<ExpenseStatus> => {
    return tx.one<ExpenseStatus>(
      countTotalSelect, { userId, groupId, startDate: time.formatDate(startDate), endDate: time.formatDate(endDate) });
  };
}

function hasUnconfirmedBefore(tx: IBaseProtocol<any>) {
  return async (groupId: number, startDate: time.DateLike): Promise<boolean> => {
    const s = await tx.one<{ amount: number }>(`
SELECT COUNT(*) AS amount
FROM expenses
WHERE group_id=$1 AND template=false AND date < $/startDate/::DATE AND confirmed=false`,
     { groupId, startDate: time.formatDate(startDate) });
    return s.amount > 0;
  };
}

function getById(tx: IBaseProtocol<any>) {
  return async (groupId: number, userId: number, expenseId: number): Promise<UserExpense> => {
    const expense = await tx.oneOrNone(
        expenseSelect(`WHERE id=$/expenseId/ AND group_id=$/groupId/`),
        { userId, expenseId, groupId },
      );
    return mapExpense(expense as UserExpense);
  };
}

function deleteById(tx: IBaseProtocol<any>) {
  return async (groupId: number, expenseId: number): Promise<ApiMessage> => {
    await tx.none(
      `DELETE FROM expenses WHERE id=$/expenseId/ AND group_id=$/groupId/`,
      { expenseId, groupId },
    );
    return { status: 'OK', message: 'Expense deleted', expenseId };
  };
}

export function storeDivision(tx: IBaseProtocol<any>) {
  return (expenseId: number, userId: number, type: ExpenseDivisionType, sum: MoneyLike) => tx.none(`
INSERT INTO expense_division (expense_id, user_id, type, sum)
VALUES ($/expenseId/::INTEGER, $/userId/::INTEGER, $/type/::expense_division_type, $/sum/::NUMERIC::MONEY)`,
    { expenseId, userId, type, sum: Money.toString(sum) });
}

function deleteDivision(tx: IBaseProtocol<any>) {
  return (expenseId: number): Promise<null> => tx.none(`
DELETE FROM expense_division WHERE expense_id=$/expenseId/::INTEGER`,
  { expenseId });
}

function getDivision(tx: IBaseProtocol<any>) {
  return async (expenseId: number): Promise<ExpenseDivisionItem[]> => {
    const items = await tx.manyOrNone(`
SELECT user_id as "userId", type, sum::MONEY::NUMERIC
FROM expense_division
WHERE expense_id=$/expenseId/::INTEGER ORDER BY type, user_id`,
      { expenseId });
    return items as ExpenseDivisionItem[];
  };
}

function createDivision(tx: IBaseProtocol<any>) {
  return async (expenseId: number, division: ExpenseDivisionItem[]) => {
    await Promise.all(division.map(d => storeDivision(tx)(expenseId, d.userId, d.type, d.sum)));
    return expenseId;
  };
}

export function setDefaults(expense: Expense): Expense {
  expense.description = expense.description ? expense.description : null;
  expense.confirmed = expense.confirmed === undefined ? true : expense.confirmed;
  delete expense.recurringExpenseId;
  return expense;
}

function createExpense(userId: number, groupId: number, expense: Expense, defaultSourceId: number): Promise<ApiMessage> {
  return db.tx(async tx => {
    expense = setDefaults(expense);
    debug('Creating expense', expense);
    const sourceId = expense.sourceId || defaultSourceId;
    const [cat, user, source] = await Promise.all([
      categories.tx.getById(tx)(groupId, expense.categoryId),
      users.tx.getById(tx)(groupId, expense.userId),
      sources.tx.getById(tx)(groupId, sourceId),
    ]);

    const division = determineDivision(expense, source);
    const id = await insert(tx)(userId, {
      ...expense,
      userId: user.id,
      groupId,
      sourceId: source.id,
      categoryId: cat.id,
      sum: expense.sum,
    }, division);
    return { status: 'OK', message: 'Expense created', expenseId: id };
  });
}

function insert(tx: IBaseProtocol<any>) {
  return async (userId: number, expense: Expense, division: ExpenseDivisionItem[]): Promise<number> => {
    const expenseId = await tx.one<number>(`
INSERT INTO expenses (
  created_by_id, user_id, group_id, date, created, type,
  receiver, sum, title, description, confirmed,
  source_id, category_id, template, recurring_expense_id)
VALUES (
  $/userId/::INTEGER, $/userId/::INTEGER, $/groupId/::INTEGER, $/date/::DATE, NOW(), $/type/::expense_type,
  $/receiver/, $/sum/::NUMERIC::MONEY, $/title/, $/description/, $/confirmed/::BOOLEAN,
  $/sourceId/::INTEGER, $/categoryId/::INTEGER, $/template/::BOOLEAN, $/recurringExpenseId/)
RETURNING id`,
      {
        ...expense,
        userId,
        sum: expense.sum.toString(),
        template: expense.template || false,
        recurringExpenseId: expense.recurringExpenseId || null,
      });
    await createDivision(tx)(expenseId, division);
    return expenseId;
  };
}

function updateExpense(tx: IBaseProtocol<any>) {
  return async (original: Expense, expense: Expense, defaultSourceId: number): Promise<ApiMessage> => {
    expense = setDefaults(expense);
    debug('Updating expense', original, 'to', expense);
    const sourceId = expense.sourceId || defaultSourceId;
    const [cat, source] = await Promise.all([
      categories.tx.getById(tx)(original.groupId, expense.categoryId),
      sources.tx.getById(tx)(original.groupId, sourceId),
    ]);
    const division = determineDivision(expense, source);
    await deleteDivision(tx)(original.id);
    await tx.none(`
UPDATE expenses
SET date=$/date/::DATE, receiver=$/receiver/, sum=$/sum/::NUMERIC::MONEY, title=$/title/,
  description=$/description/, type=$/type/::expense_type, confirmed=$/confirmed/::BOOLEAN,
  source_id=$/sourceId/::INTEGER, category_id=$/categoryId/::INTEGER
WHERE id=$/id/`,
      {
        ...expense,
        id: original.id,
        sum: expense.sum.toString(),
        sourceId: source.id,
        categoryId: cat.id,
      });
    await createDivision(tx)(original.id, division);
    return { status: 'OK', message: 'Expense updated', expenseId: original.id };
  };
}

function updateExpenseById(groupId: number, userId: number, expenseId: number, expense: Expense, defaultSourceId: number) {
  return db.tx(async (tx): Promise<ApiMessage> => {
    const e = await getById(tx)(groupId, userId, expenseId);
    return updateExpense(tx)(e, expense, defaultSourceId);
  });
}

interface ReceiverInfo {
  receiver: string;
  amount: number;
}

function queryReceivers(tx: IBaseProtocol<any>) {
  return async (groupId: number, receiver: string): Promise<ReceiverInfo[]> => {
    debug('Receivers', groupId, receiver);
    return tx.manyOrNone<ReceiverInfo>(`
SELECT receiver, COUNT(*) AS amount
FROM expenses
WHERE group_id=$/groupId/ AND receiver ILIKE $/receiver/
GROUP BY receiver ORDER BY amount DESC`,
      { groupId, receiver: `%${receiver}%` });
  };
}

function copyExpense(tx: IBaseProtocol<any>) {
  return async (
    groupId: number,
    userId: number,
    expenseId: number,
    mapper: (e: [Expense, ExpenseDivisionItem[]],
  ) => [Expense, ExpenseDivisionItem[]]): Promise<number> => {
    const e = await getExpenseAndDivision(tx)(groupId, userId, expenseId);
    const [expense, division] = mapper ? mapper(e) : e;
    return insert(tx)(userId, expense, division);
  };
}

function getExpenseAndDivision(tx: IBaseProtocol<any>) {
  return (groupId: number, userId: number, expenseId: number): Promise<[Expense, ExpenseDivisionItem[]]> => Promise.all([
    getById(tx)(groupId, userId, expenseId),
    getDivision(tx)(expenseId),
  ]);
}

export default {
  getAll: getAll(db),
  getById: getById(db),
  getDivision: getDivision(db),
  deleteById: (groupId: number, expenseId: number) => db.tx(tx => deleteById(tx)(groupId, expenseId)),
  create: createExpense,
  update: updateExpenseById,
  queryReceivers: queryReceivers(db),
  tx: {
    getById,
    insert,
    getDivision,
    countTotalBetween,
    hasUnconfirmedBefore,
    copyExpense,
    updateExpense,
    getExpenseAndDivision,
  },
  expenseSelect,
  mapExpense,
};
