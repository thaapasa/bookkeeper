import { db, DbAccess } from './Db';
import moment, { Moment } from 'moment';
import * as time from '../../shared/util/Time';
import Money, { MoneyLike } from '../../shared/util/Money';
import categories from './Categories';
import users from './Users';
import sources from './Sources';
import { determineDivision } from './ExpenseDivision';
import { NotFoundError } from '../../shared/types/Errors';
import { Expense, UserExpense, ExpenseDivisionType, ExpenseDivisionItem, ExpenseStatus } from '../../shared/types/Expense';
import { ApiMessage } from '../../shared/types/Api';
const debug = require('debug')('bookkeeper:api:expenses');

function expenseSelect(where: string): string {
  return `
SELECT
  MIN(id) AS id, MIN(date) AS date, MIN(receiver) AS receiver, MIN(type) AS type, MIN(sum) AS sum,
  MIN(title) AS title, MIN(description) AS description, BOOL_AND(confirmed) AS confirmed, MIN(source_id) AS source_id,
  MIN(user_id) AS user_id, MIN(created_by_id) AS created_by_id, MIN(group_id) AS group_id, MIN(category_id) AS category_id,
  MIN(created) AS created, MIN(recurring_expense_id) AS recurring_expense_id,
  SUM(cost) AS user_cost, SUM(benefit) AS user_benefit, SUM(income) AS user_income, SUM(split) AS user_split,
  SUM(cost + benefit + income + split) AS user_value
FROM (
  SELECT
    id, date::DATE, receiver, e.type, e.sum::MONEY::NUMERIC, title, description, confirmed,
    source_id, e.user_id, created_by_id, group_id, category_id, created, recurring_expense_id,
    (CASE WHEN d.type = 'cost' THEN d.sum::NUMERIC ELSE '0.00'::NUMERIC END) AS cost,
    (CASE WHEN d.type = 'benefit' THEN d.sum::NUMERIC ELSE '0.00'::NUMERIC END) AS benefit,
    (CASE WHEN d.type = 'income' THEN d.sum::NUMERIC ELSE '0.00'::NUMERIC END) AS income,
    (CASE WHEN d.type = 'split' THEN d.sum::NUMERIC ELSE '0.00'::NUMERIC END) AS split
  FROM expenses e
  LEFT JOIN expense_division d ON (d.expense_id = e.id AND d.user_id = $1)
  ${where}
) breakdown
GROUP BY id ORDER BY date ASC, title ASC, id
`;
}

const countTotalSelect = `
SELECT
  COALESCE(SUM(benefit), '0.00'::NUMERIC) as benefit
  COALESCE(SUM(cost), '0.00'::NUMERIC) AS cost
  COALESCE(SUM(income), '0.00'::NUMERIC) AS income
  COALESCE(SUM(split), '0.00'::NUMERIC) AS split
FROM (
  SELECT
    (CASE WHEN d.type = 'cost' THEN d.sum::NUMERIC ELSE '0.00'::NUMERIC END) AS cost,
    (CASE WHEN d.type = 'benefit' THEN d.sum::NUMERIC ELSE '0.00'::NUMERIC END) AS benefit,
    (CASE WHEN d.type = 'income' THEN d.sum::NUMERIC ELSE '0.00'::NUMERIC END) AS income,
    (CASE WHEN d.type = 'split' THEN d.sum::NUMERIC ELSE '0.00'::NUMERIC END) AS split
  FROM expenses e
  LEFT JOIN expense_division d ON (d.expense_id = e.id AND d.user_id = $1::INTEGER)
  WHERE group_id=$2::INTEGER AND template=false AND date >= $3::DATE AND date < $4::DATE
) breakdown
`;

function getAll(tx: DbAccess) {
  return async (groupId: number, userId: number): Promise<Expense[]> => {
    const expenses = await tx.queryList('expenses.get_all', expenseSelect(`WHERE group_id=$2`), [userId, groupId]);
    return expenses.map(mapExpense);
  };
}

function mapExpense(e: UserExpense): UserExpense {
  if (e === undefined) { throw new NotFoundError('EXPENSE_NOT_FOUND', 'expense'); }
  e.date = moment(e.date).format('YYYY-MM-DD');
  e.userBalance = Money.from(e.userValue).negate().toString();
  return e;
}

function countTotalBetween(tx: DbAccess) {
  return async (groupId: number, userId: number, startDate: string | Moment, endDate: string | Moment): Promise<ExpenseStatus> => {
    return await tx.queryObject('expenses.count_total_between',
      countTotalSelect, [userId, groupId, time.formatDate(startDate), time.formatDate(endDate)]) as ExpenseStatus;
  };
}

function hasUnconfirmedBefore(tx: DbAccess) {
  return async (groupId: number, startDate: time.DateLike): Promise<boolean> => {
    const s = await tx.queryObject<{ amount: number }>('expenses.count_unconfirmed_before',
      'SELECT COUNT(*) AS amount FROM expenses WHERE group_id=$1 AND template=false AND date < $2::DATE AND confirmed=false',
      [groupId, startDate]);
    return s.amount > 0;
  };
}

function getById(tx: DbAccess) {
  return async (groupId: number, userId: number, expenseId: number): Promise<UserExpense> => {
    const expense = await tx.queryObject('expenses.get_by_id', expenseSelect(`WHERE id=$2 AND group_id=$3`),
      [userId, expenseId, groupId]);
    return mapExpense(expense as UserExpense);
  };
}

function deleteById(tx: DbAccess) {
  return async (groupId: number, expenseId: number): Promise<ApiMessage> => {
    await tx.update('expenses.delete_by_id', 'DELETE FROM expenses WHERE id=$1 AND group_id=$2',
      [expenseId, groupId]);
    return { status: 'OK', message: 'Expense deleted', expenseId };
  };
}

function storeDivision(tx: DbAccess) {
  return (expenseId: number, userId: number, type: ExpenseDivisionType, sum: MoneyLike) => tx.insert('expense.create.division',
    'INSERT INTO expense_division (expense_id, user_id, type, sum) ' +
    'VALUES ($1::INTEGER, $2::INTEGER, $3::expense_division_type, $4::NUMERIC::MONEY)',
    [expenseId, userId, type, Money.toString(sum)]);
}

function deleteDivision(tx: DbAccess) {
  return (expenseId: number): Promise<number> => tx.insert('expense.delete.division',
    'DELETE FROM expense_division WHERE expense_id=$1::INTEGER', [expenseId]);
}

function getDivision(tx: DbAccess) {
  return async (expenseId: number): Promise<ExpenseDivisionItem[]> => {
    const items = await tx.queryList('expense.get.division',
      'SELECT user_id, type, sum::MONEY::NUMERIC FROM expense_division WHERE expense_id=$1::INTEGER ORDER BY type, user_id',
      [expenseId]);
    return items as ExpenseDivisionItem[];
  };
}

function createDivision(tx: DbAccess) {
  return async (expenseId: number, division: ExpenseDivisionItem[]) => {
    await Promise.all(division.map(d => storeDivision(tx)(expenseId, d.userId, d.type, d.sum)));
    return expenseId;
  };
}

function setDefaults(expense: Expense): Expense {
  expense.description = expense.description ? expense.description : null;
  expense.confirmed = expense.confirmed === undefined ? true : expense.confirmed;
  delete expense.recurringExpenseId;
  return expense;
}

function createExpense(userId: number, groupId: number, expense: Expense, defaultSourceId: number): Promise<ApiMessage> {
  return db.transaction(async tx => {
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

function insert(tx: DbAccess) {
  return async (userId: number, expense: Expense, division: ExpenseDivisionItem[]): Promise<number> => {
    const expenseId = await tx.insert('expenses.create',
      'INSERT INTO expenses (created_by_id, user_id, group_id, date, created, type, receiver, sum, title, ' +
      'description, confirmed, source_id, category_id, template, recurring_expense_id) ' +
      'VALUES ($1::INTEGER, $2::INTEGER, $3::INTEGER, $4::DATE, NOW(), $5::expense_type, $6, ' +
      '$7::NUMERIC::MONEY, $8, $9, $10::BOOLEAN, $11::INTEGER, $12::INTEGER, $13::BOOLEAN, $14) RETURNING id',
      [userId, expense.userId, expense.groupId, expense.date, expense.type, expense.receiver, expense.sum.toString(),
        expense.title, expense.description, expense.confirmed, expense.sourceId, expense.categoryId,
        expense.template || false, expense.recurringExpenseId || null]);
    await createDivision(tx)(expenseId, division);
    return expenseId;
  };
}

function updateExpense(tx: DbAccess) {
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
    await tx.insert('expenses.update',
      'UPDATE expenses SET date=$2::DATE, receiver=$3, sum=$4::NUMERIC::MONEY, title=$5, description=$6, ' +
      'type=$7::expense_type, confirmed=$8::BOOLEAN, source_id=$9::INTEGER, category_id=$10::INTEGER ' +
      'WHERE id=$1',
      [original.id, expense.date, expense.receiver, expense.sum.toString(), expense.title,
      expense.description, expense.type, expense.confirmed, source.id, cat.id]);
    await createDivision(tx)(original.id, division);
    return { status: 'OK', message: 'Expense updated', expenseId: original.id };
  };
}

function updateExpenseById(groupId: number, userId: number, expenseId: number, expense: Expense, defaultSourceId: number) {
  return db.transaction(async (tx): Promise<ApiMessage> => {
    const e = await getById(tx)(groupId, userId, expenseId);
    return updateExpense(tx)(e, expense, defaultSourceId);
  });
}

interface ReceiverInfo {
  receiver: string;
  amount: number;
}

function queryReceivers(tx: DbAccess) {
  return async (groupId: number, receiver: string): Promise<ReceiverInfo[]> => {
    debug('Receivers', groupId, receiver);
    return await tx.queryList('expenses.receiver_search',
      'SELECT receiver, COUNT(*) AS AMOUNT FROM expenses WHERE group_id=$1 AND receiver ILIKE $2 ' +
      'GROUP BY receiver ORDER BY amount DESC',
      [groupId, `%${receiver}%`]) as ReceiverInfo[];
  };
}

function copyExpense(tx: DbAccess) {
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

function getExpenseAndDivision(tx: DbAccess) {
  return (groupId: number, userId: number, expenseId: number): Promise<[Expense, ExpenseDivisionItem[]]> => Promise.all([
    getById(tx)(groupId, userId, expenseId),
    getDivision(tx)(expenseId),
  ]);
}

export default {
  getAll: getAll(db),
  getById: getById(db),
  getDivision: getDivision(db),
  deleteById: (groupId: number, expenseId: number) => db.transaction(tx => deleteById(tx)(groupId, expenseId)),
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
    getExpenseAndDivision,
  },
  expenseSelect,
  mapExpense,
};
