import debug from 'debug';
import { Moment } from 'moment';
import { IBaseProtocol } from 'pg-promise';

import { ApiMessage } from 'shared/types/Api';
import { NotFoundError } from 'shared/types/Errors';
import {
  Expense,
  ExpenseDivisionItem,
  ExpenseDivisionType,
  ExpenseStatus,
  UserExpense,
} from 'shared/types/Expense';
import Money, { MoneyLike } from 'shared/util/Money';
import * as time from 'shared/util/Time';

import { CategoryDb } from './CategoryDb';
import { determineDivision } from './ExpenseDivision';
import { SourceDb } from './SourceDb';

const log = debug('bookkeeper:api:expenses');

function expenseSelect(where: string): string {
  return `--sql
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
    id, date::DATE, receiver, e.type, e.sum, title, description, confirmed,
    source_id, e.user_id, created_by_id, group_id, category_id, created, recurring_expense_id,
    (CASE WHEN d.type = 'cost' THEN d.sum ELSE '0.00'::NUMERIC END) AS cost,
    (CASE WHEN d.type = 'benefit' THEN d.sum ELSE '0.00'::NUMERIC END) AS benefit,
    (CASE WHEN d.type = 'income' THEN d.sum ELSE '0.00'::NUMERIC END) AS income,
    (CASE WHEN d.type = 'split' THEN d.sum ELSE '0.00'::NUMERIC END) AS split,
    (CASE WHEN d.type = 'transferor' THEN d.sum ELSE '0.00'::NUMERIC END) AS transferor,
    (CASE WHEN d.type = 'transferee' THEN d.sum ELSE '0.00'::NUMERIC END) AS transferee
  FROM expenses e
  LEFT JOIN expense_division d ON (d.expense_id = e.id AND d.user_id = $/userId/)
  ${where}
) breakdown
GROUP BY id
ORDER BY date ASC, title ASC, id
`;
}

const countTotalSelect = `--sql
SELECT
  COALESCE(SUM(benefit), '0.00'::NUMERIC) as benefit,
  COALESCE(SUM(cost), '0.00'::NUMERIC) AS cost,
  COALESCE(SUM(income), '0.00'::NUMERIC) AS income,
  COALESCE(SUM(split), '0.00'::NUMERIC) AS split,
  COALESCE(SUM(transferor), '0.00'::NUMERIC) AS transferor,
  COALESCE(SUM(transferee), '0.00'::NUMERIC) AS transferee
FROM (
  SELECT
    (CASE WHEN d.type = 'cost' THEN d.sum ELSE '0.00'::NUMERIC END) AS cost,
    (CASE WHEN d.type = 'benefit' THEN d.sum ELSE '0.00'::NUMERIC END) AS benefit,
    (CASE WHEN d.type = 'income' THEN d.sum ELSE '0.00'::NUMERIC END) AS income,
    (CASE WHEN d.type = 'split' THEN d.sum ELSE '0.00'::NUMERIC END) AS split,
    (CASE WHEN d.type = 'transferor' THEN d.sum ELSE '0.00'::NUMERIC END) AS transferor,
    (CASE WHEN d.type = 'transferee' THEN d.sum ELSE '0.00'::NUMERIC END) AS transferee
  FROM expenses e
  LEFT JOIN expense_division d ON (d.expense_id = e.id AND d.user_id = $/userId/::INTEGER)
  WHERE group_id=$/groupId/::INTEGER AND template=false AND date >= $/startDate/::DATE AND date < $/endDate/::DATE
) breakdown
`;

function mapExpense(e: UserExpense): UserExpense {
  if (!e) {
    throw new NotFoundError('EXPENSE_NOT_FOUND', 'expense');
  }
  e.date = time.toMoment(e.date).format('YYYY-MM-DD');
  e.userBalance = Money.from(e.userValue).negate().toString();
  return e;
}

async function getAll(
  tx: IBaseProtocol<any>,
  groupId: number,
  userId: number
): Promise<Expense[]> {
  const expenses = await tx.map(
    expenseSelect(`WHERE group_id=$/groupId/`),
    { userId, groupId },
    mapExpense
  );
  return expenses;
}

async function countTotalBetween(
  tx: IBaseProtocol<any>,
  groupId: number,
  userId: number,
  startDate: string | Moment,
  endDate: string | Moment
): Promise<ExpenseStatus> {
  return await tx.one<ExpenseStatus>(countTotalSelect, {
    userId,
    groupId,
    startDate: time.toISODate(startDate),
    endDate: time.toISODate(endDate),
  });
}

async function hasUnconfirmedBefore(
  tx: IBaseProtocol<any>,
  groupId: number,
  startDate: time.DateLike
): Promise<boolean> {
  const s = await tx.one<{ amount: number }>(
    `SELECT COUNT(*) AS amount
      FROM expenses
      WHERE group_id=$/groupId/ AND template=false AND date < $/startDate/::DATE AND confirmed=false`,
    { groupId, startDate: time.toISODate(startDate) }
  );
  return s.amount > 0;
}

async function getById(
  tx: IBaseProtocol<any>,
  groupId: number,
  userId: number,
  expenseId: number
): Promise<UserExpense> {
  const expense = await tx.map(
    expenseSelect(`WHERE id=$/expenseId/ AND group_id=$/groupId/`),
    { userId, expenseId, groupId },
    mapExpense
  );
  if (!expense || expense.length < 1) {
    throw new NotFoundError('EXPENSE_NOT_FOUND', 'expense');
  }
  return expense[0];
}

async function deleteById(
  tx: IBaseProtocol<any>,
  groupId: number,
  expenseId: number
): Promise<ApiMessage> {
  await tx.none(
    `DELETE FROM expenses WHERE id=$/expenseId/ AND group_id=$/groupId/`,
    { expenseId, groupId }
  );
  return { status: 'OK', message: 'Expense deleted', expenseId };
}

const storeDivision = (
  tx: IBaseProtocol<any>,
  expenseId: number,
  userId: number,
  type: ExpenseDivisionType,
  sum: MoneyLike
) =>
  tx.none(
    `INSERT INTO expense_division
        (expense_id, user_id, type, sum)
      VALUES
        ($/expenseId/::INTEGER, $/userId/::INTEGER, $/type/::expense_division_type, $/sum/)`,
    { expenseId, userId, type, sum: Money.toString(sum) }
  );

const deleteDivision = (
  tx: IBaseProtocol<any>,
  expenseId: number
): Promise<null> =>
  tx.none(
    `DELETE FROM expense_division
      WHERE expense_id=$/expenseId/::INTEGER`,
    { expenseId }
  );

async function getDivision(
  tx: IBaseProtocol<any>,
  expenseId: number
): Promise<ExpenseDivisionItem[]> {
  const items = await tx.manyOrNone<ExpenseDivisionItem>(
    `SELECT user_id as "userId", type, sum
      FROM expense_division
      WHERE expense_id=$/expenseId/::INTEGER
      ORDER BY type, user_id`,
    { expenseId }
  );
  return items;
}

async function createDivision(
  tx: IBaseProtocol<any>,
  expenseId: number,
  division: ExpenseDivisionItem[]
) {
  await Promise.all(
    division.map(d => storeDivision(tx, expenseId, d.userId, d.type, d.sum))
  );
  return expenseId;
}

function setDefaults(expense: Expense): Expense {
  expense.description = expense.description ? expense.description : null;
  expense.confirmed =
    expense.confirmed === undefined ? true : expense.confirmed;
  expense.recurringExpenseId = null;
  return expense;
}

async function insert(
  tx: IBaseProtocol<any>,
  userId: number,
  expense: Expense,
  division: ExpenseDivisionItem[]
): Promise<number> {
  const expenseId = (
    await tx.one<{ id: number }>(
      `INSERT INTO expenses (
          created_by_id, user_id, group_id, date, created, type,
          receiver, sum, title, description, confirmed,
          source_id, category_id, template, recurring_expense_id)
        VALUES (
          $/userId/::INTEGER, $/expenseOwnerId/::INTEGER, $/groupId/::INTEGER, $/date/::DATE, NOW(), $/type/::expense_type,
          $/receiver/, $/sum/, $/title/, $/description/, $/confirmed/::BOOLEAN,
          $/sourceId/::INTEGER, $/categoryId/::INTEGER, $/template/::BOOLEAN, $/recurringExpenseId/)
        RETURNING id`,
      {
        ...expense,
        userId,
        expenseOwnerId: expense.userId,
        sum: expense.sum.toString(),
        template: expense.template || false,
        recurringExpenseId: expense.recurringExpenseId || null,
      }
    )
  ).id;
  await createDivision(tx, expenseId, division);
  return expenseId;
}

async function update(
  tx: IBaseProtocol<any>,
  original: Expense,
  expense: Expense,
  defaultSourceId: number
): Promise<ApiMessage> {
  expense = setDefaults(expense);
  log('Updating expense', original, 'to', expense);
  const sourceId = expense.sourceId || defaultSourceId;
  const [cat, source] = await Promise.all([
    CategoryDb.getById(tx, original.groupId, expense.categoryId),
    SourceDb.getById(tx, original.groupId, sourceId),
  ]);
  const division = determineDivision(expense, source);
  await deleteDivision(tx, original.id);
  await tx.none(
    `UPDATE expenses
      SET date=$/date/::DATE, receiver=$/receiver/, sum=$/sum/, title=$/title/,
        description=$/description/, type=$/type/::expense_type, confirmed=$/confirmed/::BOOLEAN,
        source_id=$/sourceId/::INTEGER, category_id=$/categoryId/::INTEGER, user_id=$/userId/::INTEGER
      WHERE id=$/id/`,
    {
      ...expense,
      id: original.id,
      sum: expense.sum.toString(),
      sourceId: source.id,
      categoryId: cat.id,
    }
  );
  await createDivision(tx, original.id, division);
  return { status: 'OK', message: 'Expense updated', expenseId: original.id };
}

interface ReceiverInfo {
  receiver: string;
  amount: number;
}

function queryReceivers(
  tx: IBaseProtocol<any>,
  groupId: number,
  receiver: string
): Promise<ReceiverInfo[]> {
  log('Receivers', groupId, receiver);
  return tx.manyOrNone<ReceiverInfo>(
    `SELECT receiver, COUNT(*) AS amount
      FROM expenses
      WHERE group_id=$/groupId/ AND receiver ILIKE $/receiver/
      GROUP BY receiver ORDER BY amount DESC`,
    { groupId, receiver: `%${receiver}%` }
  );
}

const getExpenseAndDivision = (
  tx: IBaseProtocol<any>,
  groupId: number,
  userId: number,
  expenseId: number
): Promise<[Expense, ExpenseDivisionItem[]]> =>
  Promise.all([
    getById(tx, groupId, userId, expenseId),
    getDivision(tx, expenseId),
  ]);

export const BasicExpenseDb = {
  getAll,
  getById,
  getDivision,
  deleteById,
  update,
  queryReceivers,
  storeDivision,
  insert,
  countTotalBetween,
  hasUnconfirmedBefore,
  getExpenseAndDivision,
  expenseSelect,
  mapExpense,
  setDefaults,
};