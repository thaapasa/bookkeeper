import { DateTime } from 'luxon';

type DateTimeInput = DateTime | string;

import {
  Expense,
  ExpenseDivisionItem,
  ExpenseDivisionType,
  ExpenseInput,
  ExpenseInputWithDefaults,
  ExpenseStatus,
  UserExpense,
} from 'shared/expense';
import { DateLike, toISODate } from 'shared/time';
import { ApiMessage, isDefined, NotFoundError, ObjectId } from 'shared/types';
import { Money, MoneyLike } from 'shared/util';
import { DbTask } from 'server/data/Db.ts';
import { logger } from 'server/Logger';

import { getCategoryById } from './CategoryDb';
import { determineDivision } from './ExpenseDivision';
import { getSourceById } from './SourceDb';

/**
 * Correlated subquery that computes the array of matching grouping IDs for an expense.
 * Replaces the previous LEFT JOIN to expense_groupings which caused a cross-join.
 */
const AUTO_GROUPING_IDS_SUBQUERY = /*sql*/ `(
  SELECT ARRAY_AGG(eg.id) FROM expense_groupings eg
  WHERE eg.id = e.grouping_id
  OR (
    eg.group_id = e.group_id
    AND eg.id IN (
      SELECT egc.expense_grouping_id FROM expense_grouping_categories egc
      WHERE egc.category_id IN (e.category_id, (SELECT parent_id FROM categories WHERE id = e.category_id))
        AND (eg.start_date IS NULL OR eg.start_date <= e.date)
        AND (eg.end_date IS NULL OR eg.end_date >= e.date)
        AND (eg.only_own IS FALSE OR e.user_id = $/userId/)
    )
  )
)`;

/**
 * EXISTS condition that checks if an expense matches a specific grouping,
 * either by direct assignment or by auto-grouping via category.
 */
export const EXPENSE_MATCHES_GROUPING = /*sql*/ `(
  e.grouping_id = $/groupingId/
  OR (e.grouping_id IS NULL AND EXISTS (
    SELECT 1 FROM expense_groupings eg
    JOIN expense_grouping_categories egc ON egc.expense_grouping_id = eg.id
    WHERE eg.id = $/groupingId/
      AND eg.group_id = e.group_id
      AND egc.category_id IN (e.category_id, (SELECT parent_id FROM categories WHERE id = e.category_id))
      AND (eg.start_date IS NULL OR eg.start_date <= e.date)
      AND (eg.end_date IS NULL OR eg.end_date >= e.date)
      AND (eg.only_own IS FALSE OR e.user_id = $/userId/)
  ))
)`;

export function expenseSelectClause(
  where: string,
  orderBy = 'ORDER BY date ASC, title ASC, id',
): string {
  return `--sql
SELECT
  MIN(id) AS id, MIN(date) AS date, MIN(receiver) AS receiver, MIN(type) AS type, MIN(sum) AS sum,
  MIN(title) AS title, MIN(description) AS description, BOOL_AND(confirmed) AS confirmed, MIN(source_id) AS "sourceId",
  MIN(user_id) AS "userId", MIN(created_by_id) AS "createdById", MIN(breakdown.group_id) AS "groupId", MIN(category_id) AS "categoryId",
  MIN(grouping_id) AS "groupingId", MIN(auto_grouping_ids) AS "autoGroupingIds",
  MIN(created) AS created, MIN(recurring_expense_id) AS "recurringExpenseId",
  SUM(cost) AS "userCost", SUM(benefit) AS "userBenefit", SUM(income) AS "userIncome", SUM(split) AS "userSplit",
  SUM(transferor) AS "userTransferor", SUM(transferee) AS "userTransferee",
  SUM(cost + benefit + income + split + transferor + transferee) AS "userValue"
FROM (
  SELECT
    e.id, e.date::DATE, e.receiver, e.type, e.sum, e.title, e.description, e.confirmed, e.grouping_id,
    ${AUTO_GROUPING_IDS_SUBQUERY} AS auto_grouping_ids,
    e.source_id, e.user_id, e.created_by_id, e.group_id, e.category_id, e.created, e.recurring_expense_id,
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
${orderBy}
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
  WHERE e.group_id=$/groupId/::INTEGER AND template=false AND date >= $/startDate/::DATE AND date < $/endDate/::DATE
) breakdown
`;

export function dbRowToExpense(e: UserExpense): UserExpense {
  if (!e) {
    throw new NotFoundError('EXPENSE_NOT_FOUND', 'expense');
  }
  e.autoGroupingIds = (e.autoGroupingIds ?? []).filter(isDefined);
  e.date = toISODate(e.date);
  e.userBalance = Money.from(e.userValue).negate().toString();
  e.groupingId = e.groupingId ?? undefined;
  return e;
}

export async function getAllExpenses(
  tx: DbTask,
  groupId: number,
  userId: number,
): Promise<Expense[]> {
  const expenses = await tx.map(
    expenseSelectClause(`WHERE e.group_id=$/groupId/`),
    { userId, groupId },
    dbRowToExpense,
  );
  return expenses;
}

export async function countTotalBetween(
  tx: DbTask,
  groupId: number,
  userId: number,
  startDate: DateTimeInput,
  endDateExclusive: DateTimeInput,
): Promise<ExpenseStatus> {
  return await tx.one<ExpenseStatus>(countTotalSelect, {
    userId,
    groupId,
    startDate: toISODate(startDate),
    endDate: toISODate(endDateExclusive),
  });
}

export async function hasUnconfirmedBefore(
  tx: DbTask,
  groupId: number,
  startDate: DateLike,
): Promise<boolean> {
  const s = await tx.one<{ amount: number }>(
    `SELECT COUNT(*) AS amount
      FROM expenses
      WHERE group_id=$/groupId/ AND template=false AND date < $/startDate/::DATE AND confirmed=false`,
    { groupId, startDate: toISODate(startDate) },
  );
  return s.amount > 0;
}

export async function getExpenseById(
  tx: DbTask,
  groupId: number,
  userId: number,
  expenseId: number,
): Promise<UserExpense> {
  const expense = await tx.map(
    expenseSelectClause(`WHERE e.id=$/expenseId/ AND e.group_id=$/groupId/`),
    { userId, expenseId, groupId },
    dbRowToExpense,
  );
  if (!expense || expense.length < 1) {
    throw new NotFoundError('EXPENSE_NOT_FOUND', 'expense');
  }
  return expense[0];
}

export async function deleteExpenseById(
  tx: DbTask,
  groupId: number,
  expenseId: number,
): Promise<ApiMessage> {
  await tx.none(`DELETE FROM expenses WHERE id=$/expenseId/ AND group_id=$/groupId/`, {
    expenseId,
    groupId,
  });
  return { status: 'OK', message: 'Expense deleted', expenseId };
}

export const storeExpenseDivision = (
  tx: DbTask,
  expenseId: number,
  userId: number,
  type: ExpenseDivisionType,
  sum: MoneyLike,
) =>
  tx.none(
    `INSERT INTO expense_division
        (expense_id, user_id, type, sum)
      VALUES
        ($/expenseId/::INTEGER, $/userId/::INTEGER, $/type/::expense_division_type, $/sum/)`,
    { expenseId, userId, type, sum: Money.toString(sum) },
  );

const deleteDivision = (tx: DbTask, expenseId: number): Promise<null> =>
  tx.none(
    `DELETE FROM expense_division
      WHERE expense_id=$/expenseId/::INTEGER`,
    { expenseId },
  );

export async function getExpenseDivision(
  tx: DbTask,
  expenseId: number,
): Promise<ExpenseDivisionItem[]> {
  const items = await tx.manyOrNone<ExpenseDivisionItem>(
    `SELECT user_id as "userId", type, sum
      FROM expense_division
      WHERE expense_id=$/expenseId/::INTEGER
      ORDER BY type, user_id`,
    { expenseId },
  );
  return items;
}

async function createDivision(tx: DbTask, expenseId: number, division: ExpenseDivisionItem[]) {
  await Promise.all(
    division.map(d => storeExpenseDivision(tx, expenseId, d.userId, d.type, d.sum)),
  );
  return expenseId;
}

export function setExpenseDataDefaults(expense: Expense | ExpenseInput): ExpenseInputWithDefaults {
  const data = {
    ...expense,
    description: expense.description || null,
    confirmed: expense.confirmed ?? true,
    recurringExpenseId: null,
  };
  return data;
}

export type ExpenseInsert = Omit<
  Expense,
  'id' | 'createdById' | 'created' | 'recurringExpenseId' | 'template'
> & {
  template?: boolean;
  recurringExpenseId?: ObjectId | null;
};

export async function createNewExpense(
  tx: DbTask,
  userId: number,
  expense: ExpenseInsert,
  division: ExpenseDivisionItem[],
): Promise<number> {
  const expenseId = (
    await tx.one<{ id: number }>(
      `INSERT INTO expenses (
          created_by_id, user_id, group_id, date, created, type,
          receiver, sum, title, description, confirmed, grouping_id,
          source_id, category_id, template, recurring_expense_id)
        VALUES (
          $/userId/::INTEGER, $/expenseOwnerId/::INTEGER, $/groupId/::INTEGER, $/date/::DATE, NOW(), $/type/::expense_type,
          $/receiver/, $/sum/, $/title/, $/description/, $/confirmed/::BOOLEAN, $/groupingId/,
          $/sourceId/::INTEGER, $/categoryId/::INTEGER, $/template/::BOOLEAN, $/recurringExpenseId/)
        RETURNING id`,
      {
        ...expense,
        userId,
        expenseOwnerId: expense.userId,
        sum: expense.sum.toString(),
        template: expense.template || false,
        recurringExpenseId: expense.recurringExpenseId || null,
        groupingId: expense.groupingId,
      },
    )
  ).id;
  await createDivision(tx, expenseId, division);
  return expenseId;
}

export async function updateExpense(
  tx: DbTask,
  original: Expense,
  expenseInput: ExpenseInput,
  defaultSourceId: number,
): Promise<ApiMessage> {
  const expense = setExpenseDataDefaults(expenseInput);
  logger.debug({ original, expense }, 'Updating expense');
  const sourceId = expense.sourceId || defaultSourceId;
  const [cat, source] = await Promise.all([
    getCategoryById(tx, original.groupId, expense.categoryId),
    getSourceById(tx, original.groupId, sourceId),
  ]);
  const division = determineDivision(expense, source);
  await deleteDivision(tx, original.id);
  await tx.none(
    `UPDATE expenses
      SET date=$/date/::DATE, receiver=$/receiver/, sum=$/sum/, title=$/title/, grouping_id=$/groupingId/,
        description=$/description/, type=$/type/::expense_type, confirmed=$/confirmed/::BOOLEAN,
        source_id=$/sourceId/::INTEGER, category_id=$/categoryId/::INTEGER, user_id=$/userId/::INTEGER
      WHERE id=$/id/`,
    {
      ...expense,
      groupingId: expense.groupingId,
      id: original.id,
      sum: expense.sum.toString(),
      sourceId: source.id,
      categoryId: cat.id,
    },
  );
  await createDivision(tx, original.id, division);
  return { status: 'OK', message: 'Expense updated', expenseId: original.id };
}

interface ReceiverInfo {
  receiver: string;
  amount: number;
}

export function queryReceivers(
  tx: DbTask,
  groupId: number,
  receiver: string,
): Promise<ReceiverInfo[]> {
  return tx.manyOrNone<ReceiverInfo>(
    `SELECT receiver, COUNT(*) AS amount
      FROM expenses
      WHERE group_id=$/groupId/ AND receiver ILIKE $/receiver/
      GROUP BY receiver ORDER BY amount DESC`,
    { groupId, receiver: `%${receiver}%` },
  );
}

export async function renameReceiver(
  tx: DbTask,
  groupId: number,
  oldName: string,
  newName: string,
): Promise<number> {
  logger.debug('Renaming receiver %s to %s', oldName, newName);
  const res = await tx.result(
    `UPDATE expenses
      SET receiver=$/newName/
      WHERE group_id=$/groupId/ AND receiver=$/oldName/`,
    { groupId, oldName, newName },
  );
  return res.rowCount;
}

async function getRecurrenceOccurence(
  tx: DbTask,
  groupId: ObjectId,
  userId: ObjectId,
  recurringExpenseId: ObjectId,
  first: boolean,
): Promise<Expense | undefined> {
  const expense = await tx.map(
    expenseSelectClause(
      `WHERE recurring_expense_id=$/recurringExpenseId/ AND e.group_id=$/groupId/`,
      `ORDER BY date ${first ? 'ASC' : 'DESC'} LIMIT 1`,
    ),
    { recurringExpenseId, userId, groupId },
    dbRowToExpense,
  );
  return expense[0];
}

export const getFirstRecurrence = (
  tx: DbTask,
  groupId: ObjectId,
  userId: ObjectId,
  recurringExpenseId: ObjectId,
) => getRecurrenceOccurence(tx, groupId, userId, recurringExpenseId, true);

export const getLastRecurrence = (
  tx: DbTask,
  groupId: ObjectId,
  userId: ObjectId,
  recurringExpenseId: ObjectId,
) => getRecurrenceOccurence(tx, groupId, userId, recurringExpenseId, false);
