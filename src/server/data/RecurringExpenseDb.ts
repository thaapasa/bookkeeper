import { Moment } from 'moment';
import { ITask } from 'pg-promise';

import {
  Expense,
  ExpenseDivisionItem,
  ExpenseInput,
  Recurrence,
  RecurrencePeriod,
  recurrencePerMonth,
  recurrencePerYear,
  RecurrenceUnit,
  RecurringExpense,
  RecurringExpenseDetails,
  RecurringExpenseInput,
  RecurringExpenseTarget,
  SubscriptionSearchCriteria,
  UserExpense,
} from 'shared/expense';
import { DateLike, ISODate, toDate, toISODate, toMoment } from 'shared/time';
import {
  ApiMessage,
  DbObject,
  InvalidExpense,
  InvalidInputError,
  NotFoundError,
  ObjectId,
} from 'shared/types';
import { assertDefined, camelCaseObject, Money, toArray, unnest } from 'shared/util';
import { logger } from 'server/Logger';

import {
  createNewExpense,
  deleteExpenseById,
  getExpenseById,
  getFirstRecurrence,
  getLastRecurrence,
  setExpenseDataDefaults,
  storeExpenseDivision,
  updateExpense,
} from './BasicExpenseDb';
import { copyExpense, getExpenseAndDivisionData, updateExpenseById } from './BasicExpenseService';
import { getCategoryById } from './CategoryDb';
import { determineDivision } from './ExpenseDivision';
import { calculateNextRecurrence } from './RecurringExpenseService';
import { getSourceById } from './SourceDb';

const RecurringExpenseSelect = `SELECT *, re.id AS "recurringExpenseId" FROM recurring_expenses re
  LEFT JOIN expenses e ON (e.id = re.template_expense_id)`;

export async function searchRecurringExpenses(
  tx: ITask<any>,
  groupId: ObjectId,
  userId: ObjectId,
  criteria: SubscriptionSearchCriteria = {},
): Promise<RecurringExpense[]> {
  const type = criteria.type && toArray(criteria.type);
  const expenses = await tx.manyOrNone(
    `--sql
    ${RecurringExpenseSelect}
      WHERE re.group_id = $/groupId/
        AND e.group_id = $/groupId/
        ${criteria.includeEnded ? '' : `AND (occurs_until IS NULL OR occurs_until >= NOW())`}
        ${criteria.onlyOwn ? `AND user_id = $/userId/` : ''}
        ${type ? 'AND e.type IN ($/type:csv/)' : ''}`,
    { groupId, type, userId },
  );
  return expenses.map(mapRecurringExpense);
}

async function getRecurringExpenseInfo(
  tx: ITask<any>,
  groupId: ObjectId,
  recurringExpenseId: ObjectId,
): Promise<RecurringExpense> {
  const row = await tx.oneOrNone(
    `--sql
      ${RecurringExpenseSelect}
        WHERE re.group_id = $/groupId/
          AND e.group_id = $/groupId/
          AND re.id = $/recurringExpenseId/`,
    { groupId, recurringExpenseId },
  );
  if (!row) {
    throw new NotFoundError('RECURRING_EXPENSE_NOT_FOUND', `Recurring expense`, recurringExpenseId);
  }
  return mapRecurringExpense(row);
}

export async function getRecurringExpenseTemplate(
  tx: ITask<any>,
  groupId: ObjectId,
  userId: ObjectId,
  recurringExpenseId: ObjectId,
): Promise<UserExpense> {
  const recurringExpense = await getRecurringExpenseInfo(tx, groupId, recurringExpenseId);
  return getExpenseById(tx, groupId, userId, recurringExpense.templateExpenseId);
}

export async function updateRecurringExpenseTemplate(
  tx: ITask<any>,
  groupId: ObjectId,
  userId: ObjectId,
  expenseId: ObjectId,
  data: ExpenseInput,
  defaultSourceId: ObjectId,
): Promise<ApiMessage> {
  const expense = await getExpenseById(tx, groupId, userId, expenseId);
  assertDefined(expense.recurringExpenseId);
  const recurringExpense = await getRecurringExpenseInfo(tx, groupId, expense.recurringExpenseId);
  return updateExpenseById(
    tx,
    groupId,
    userId,
    recurringExpense.templateExpenseId,
    data,
    defaultSourceId,
  );
}

export async function getRecurringExpenseDetails(
  tx: ITask<any>,
  groupId: ObjectId,
  userId: ObjectId,
  recurringExpenseId: ObjectId,
): Promise<RecurringExpenseDetails> {
  const recurringExpense = await getRecurringExpenseInfo(tx, groupId, recurringExpenseId);
  const totals = await tx.one(
    `SELECT COUNT(*) AS "count", SUM(sum) AS "sum" FROM expenses WHERE recurring_expense_id=$/recurringExpenseId/`,
    { recurringExpenseId },
  );
  const [firstOccurence, lastOccurence] = await Promise.all([
    getFirstRecurrence(tx, groupId, userId, recurringExpenseId),
    getLastRecurrence(tx, groupId, userId, recurringExpenseId),
  ]);
  return {
    recurringExpense,
    totalExpenses: totals.count,
    totalSum: totals.sum,
    firstOccurence,
    lastOccurence,
  };
}

function mapRecurringExpense(row: any): RecurringExpense {
  const period: RecurrencePeriod = {
    unit: row.period_unit,
    amount: row.period_amount,
  };
  const sum = Money.from(row.sum).toString();
  return {
    id: row.recurringExpenseId,
    type: 'recurring',
    templateExpenseId: row.template_expense_id,
    title: row.title,
    receiver: row.receiver,
    sum,
    categoryId: row.category_id,
    period,
    nextMissing: toISODate(row.next_missing),
    firstOccurence: toISODate(row.date),
    occursUntil: row.occurs_until ? toISODate(row.occurs_until) : undefined,
    recurrencePerMonth: recurrencePerMonth(sum, period).toString(),
    recurrencePerYear: recurrencePerYear(sum, period).toString(),
  };
}

export async function createRecurringFromExpense(
  tx: ITask<any>,
  groupId: ObjectId,
  userId: ObjectId,
  expenseId: ObjectId,
  recurrence: RecurringExpenseInput,
): Promise<ApiMessage> {
  logger.info(
    `Create recurring expense with a period of ${recurrence.period.amount} ${recurrence.period.unit} from ${expenseId}`,
  );
  let nextMissing: Moment | undefined;
  const templateId = await copyExpense(tx, groupId, userId, expenseId, e => {
    const [expense, division] = e;
    if (expense.recurringExpenseId && expense.recurringExpenseId > 0) {
      throw new InvalidInputError(
        'INVALID_INPUT',
        `Expense ${expenseId} is already a recurring expense (${expense.recurringExpenseId})`,
      );
    }
    nextMissing = calculateNextRecurrence(expense.date, recurrence.period);
    return [{ ...expense, template: true }, division];
  });
  const recurringExpenseId = (
    await tx.one<{ id: number }>(
      `INSERT INTO recurring_expenses (template_expense_id, period_amount, period_unit, next_missing, group_id)
          VALUES ($/templateId/, $/periodAmount/, $/periodUnit/, $/nextMissing/::DATE, $/groupId/)
          RETURNING id`,
      {
        templateId,
        periodAmount: recurrence.period.amount,
        periodUnit: recurrence.period.unit,
        nextMissing: toISODate(nextMissing),
        groupId,
      },
    )
  ).id;

  await tx.none(
    `UPDATE expenses
        SET recurring_expense_id=$/recurringExpenseId/
        WHERE id IN ($/expenseId/, $/templateId/)`,
    { recurringExpenseId, expenseId, templateId },
  );
  return {
    status: 'OK',
    message: 'Recurrence created',
    expenseId,
    templateExpenseId: templateId,
    recurringExpenseId,
  };
}

function getDatesUpTo(recurrence: Recurrence, date: Moment): string[] {
  let generating = toMoment(recurrence.nextMissing);
  const dates: string[] = [];
  while (generating.isBefore(date)) {
    dates.push(toISODate(generating));
    generating = calculateNextRecurrence(generating, recurrence.period);
  }
  return dates;
}

function createMissingRecurrenceForDate(
  tx: ITask<any>,
  e: [Expense, ExpenseDivisionItem[]],
  date: string,
): Promise<number> {
  const [exp, division] = e;
  const expense = { ...exp, template: false, date };
  logger.debug('Creating missing expense %s at %s', expense.title, expense.date);
  return createNewExpense(tx, expense.userId, expense, division);
}

async function createMissingRecurrences(
  tx: ITask<any>,
  groupId: number,
  userId: number,
  date: Moment,
  recurrenceDb: RecurrenceInDb,
) {
  const recurrence: Recurrence = {
    ...recurrenceDb,
    period: {
      amount: recurrenceDb.periodAmount,
      unit: recurrenceDb.periodUnit,
    },
  };
  const until = recurrence.occursUntil ? toMoment(recurrence.occursUntil) : null;
  const maxDate = until?.isBefore(date) ? until : toMoment(date);
  const dates = getDatesUpTo(recurrence, maxDate);
  if (dates.length < 1) {
    return;
  }
  const lastDate = dates[dates.length - 1];
  const nextMissing = calculateNextRecurrence(lastDate, recurrence.period);
  logger.info(
    `Creating missing expenses for ${recurrence} ${dates}. Next missing is ${toISODate(
      nextMissing,
    )}`,
  );
  const expense = await getExpenseAndDivisionData(
    tx,
    groupId,
    userId,
    recurrence.templateExpenseId,
  );
  await tx.batch(dates.map(date => createMissingRecurrenceForDate(tx, expense, date)));
  await tx.none(
    `UPDATE recurring_expenses
        SET next_missing=$/nextMissing/::DATE
        WHERE id=$/recurringExpenseId/`,
    {
      nextMissing: toISODate(nextMissing),
      recurringExpenseId: recurrence.id,
    },
  );
}

interface RecurrenceInDb extends DbObject, Omit<RecurringExpenseInput, 'period'> {
  nextMissing: ISODate;
  templateExpenseId: number;
  periodAmount: number;
  periodUnit: RecurrenceUnit;
}

/**
 * Populates all missing recurring expenses for this group, up to the given date
 */
export async function createMissingRecurringExpenses(
  tx: ITask<any>,
  groupId: number,
  userId: number,
  date: Moment,
): Promise<void> {
  logger.debug('Checking for missing expenses');
  const list = await tx.map<RecurrenceInDb>(
    `SELECT *
        FROM recurring_expenses
        WHERE group_id=$/groupId/ AND next_missing < $/nextMissing/::DATE`,
    { groupId, nextMissing: date },
    camelCaseObject,
  );
  await tx.batch(list.map(v => createMissingRecurrences(tx, groupId, userId, date, v)));
}

async function deleteRecurrenceAndExpenses(
  tx: ITask<any>,
  recurringExpenseId: number,
): Promise<ApiMessage> {
  const [expenseCount] = await Promise.all([
    tx.none(`DELETE FROM expenses WHERE recurring_expense_id=$/recurringExpenseId/`, {
      recurringExpenseId,
    }),
    tx.none(`DELETE FROM recurring_expenses WHERE id=$/recurringExpenseId/`, {
      recurringExpenseId,
    }),
  ]);
  return {
    status: 'OK',
    message: `All ${expenseCount} expense(s) belonging to recurrence ${recurringExpenseId} have been deleted`,
  };
}

async function terminateRecurrenceAt(tx: ITask<any>, recurringExpenseId: number, date: DateLike) {
  await tx.none(
    `UPDATE recurring_expenses
        SET occurs_until=$/date/::date
        WHERE id=$/recurringExpenseId/`,
    { recurringExpenseId, date },
  );
}

async function deleteRecurrenceAfter(
  tx: ITask<any>,
  expenseId: number,
  afterDate: DateLike,
  recurringExpenseId: number,
): Promise<ApiMessage> {
  const [expenseCount] = await Promise.all([
    tx.none(
      `DELETE FROM expenses
        WHERE recurring_expense_id=$/recurringExpenseId/ AND (id=$/expenseId/ OR date > $/afterDate/::date)`,
      { recurringExpenseId, expenseId, afterDate },
    ),
    terminateRecurrenceAt(tx, recurringExpenseId, afterDate),
  ]);
  return {
    status: 'OK',
    message: `${expenseCount} expense(s) on or after ${afterDate} belonging to recurrence ${recurringExpenseId} have been deleted`,
  };
}

export async function deleteRecurringByExpenseId(
  tx: ITask<any>,
  groupId: ObjectId,
  userId: ObjectId,
  expenseId: ObjectId,
  target: RecurringExpenseTarget,
): Promise<ApiMessage> {
  logger.info(`Deleting recurring via expense ${expenseId} - targeting ${target}`);
  if (target === 'single') {
    return deleteExpenseById(tx, groupId, expenseId);
  }
  const exp = await getExpenseById(tx, groupId, userId, expenseId);
  if (!exp.recurringExpenseId) {
    throw new InvalidExpense('Not a recurring expense');
  }
  switch (target) {
    case 'all':
      return deleteRecurrenceAndExpenses(tx, exp.recurringExpenseId);
    case 'after':
      return deleteRecurrenceAfter(tx, expenseId, exp.date, exp.recurringExpenseId);
    default:
      throw new InvalidExpense(`Invalid target ${target}`);
  }
}

export async function deleteRecurringExpenseById(
  tx: ITask<any>,
  groupId: ObjectId,
  recurringExpenseId: ObjectId,
): Promise<ApiMessage> {
  const recurring = await getRecurringExpenseInfo(tx, groupId, recurringExpenseId);
  const now = toDate(toMoment());
  logger.info(`Deleting recurring ${recurring.id} at ${now}`);

  await terminateRecurrenceAt(tx, recurringExpenseId, now);
  return { status: 'OK', message: `Recurrence cleared at ${now}` };
}

function deleteDivisionForRecurrence(
  tx: ITask<any>,
  recurringExpenseId: number,
  afterDate: DateLike | null,
): Promise<null> {
  return tx.none(
    `DELETE FROM expense_division
      WHERE expense_id IN (
        SELECT id FROM expenses
        WHERE recurring_expense_id=$/recurringExpenseId/::INTEGER
          AND (template=true OR $/afterDate/::DATE IS NULL OR date >= $/afterDate/::DATE)
      )`,
    { recurringExpenseId, afterDate },
  );
}

async function getRecurringExpenseIds(
  tx: ITask<any>,
  recurringExpenseId: number,
  afterDate: DateLike | null,
): Promise<number[]> {
  return (
    await tx.manyOrNone<{ id: number }>(
      `SELECT id
        FROM expenses
        WHERE recurring_expense_id=$/recurringExpenseId/
          AND (template=true OR $/afterDate/::DATE IS NULL OR date >= $/afterDate/::DATE)`,
      { recurringExpenseId, afterDate },
    )
  ).map(e => e.id);
}

async function createDivisionForRecurrence(
  tx: ITask<any>,
  recurringExpenseId: number,
  division: ExpenseDivisionItem[],
  afterDate: DateLike | null,
): Promise<number> {
  const ids = await getRecurringExpenseIds(tx, recurringExpenseId, afterDate);
  await Promise.all(
    unnest(
      ids.map(expenseId =>
        division.map(d => storeExpenseDivision(tx, expenseId, d.userId, d.type, d.sum)),
      ),
    ),
  );
  return recurringExpenseId;
}

async function updateRecurringExpense(
  tx: ITask<any>,
  target: RecurringExpenseTarget,
  original: Expense,
  expenseInput: ExpenseInput,
  defaultSourceId: number,
): Promise<ApiMessage> {
  if (!original.recurringExpenseId) {
    throw new InvalidExpense(`Invalid target ${target}`);
  }
  const expense = setExpenseDataDefaults(expenseInput);
  logger.debug({ original, expense }, `Updating recurring expense`);
  const sourceId = expense.sourceId || defaultSourceId;
  const [cat, source] = await Promise.all([
    getCategoryById(tx, original.groupId, expense.categoryId),
    getSourceById(tx, original.groupId, sourceId),
  ]);
  await tx.none(
    `UPDATE expenses
      SET date=$/date/::DATE, receiver=$/receiver/, sum=$/sum/, title=$/title/,
        description=$/description/, type=$/type/::expense_type, confirmed=$/confirmed/::BOOLEAN,
        source_id=$/sourceId/::INTEGER, category_id=$/categoryId/::INTEGER
      WHERE id=$/id/`,
    {
      ...expense,
      id: original.id,
      sum: expense.sum.toString(),
      sourceId: source.id,
      categoryId: cat.id,
    },
  );
  const division = determineDivision(expense, source);
  const afterDate = target === 'after' ? original.date : null;
  await tx.none(
    `UPDATE expenses
      SET receiver=$/receiver/, sum=$/sum/, title=$/title/, description=$/description/,
        type=$/type/::expense_type, confirmed=$/confirmed/::BOOLEAN,
        source_id=$/sourceId/::INTEGER, category_id=$/categoryId/::INTEGER
      WHERE recurring_expense_id=$/recurringExpenseId/
        AND (template = true OR $/afterDate/::DATE IS NULL OR date >= $/afterDate/::DATE)`,
    {
      ...expense,
      recurringExpenseId: original.recurringExpenseId,
      afterDate,
      sum: expense.sum.toString(),
      sourceId: source.id,
      categoryId: cat.id,
    },
  );
  await deleteDivisionForRecurrence(tx, original.recurringExpenseId, afterDate);
  await createDivisionForRecurrence(tx, original.recurringExpenseId, division, afterDate);
  return {
    status: 'OK',
    message: 'Recurring expenses updated',
    expenseId: original.id,
    recurringExpenseId: original.recurringExpenseId,
  };
}

export async function updateRecurringExpenseByExpenseId(
  tx: ITask<any>,
  groupId: number,
  userId: number,
  expenseId: number,
  target: RecurringExpenseTarget,
  expense: ExpenseInput,
  defaultSourceId: number,
): Promise<ApiMessage> {
  logger.info(`Updating recurring expense ${expenseId} - targeting ${target}`);
  const org = await getExpenseById(tx, groupId, userId, expenseId);
  if (!org.recurringExpenseId) {
    throw new InvalidExpense(`${expenseId} is not a recurring expense`);
  }

  if (target === 'single') {
    return updateExpense(tx, org, expense, defaultSourceId);
  } else {
    return updateRecurringExpense(tx, target, org, expense, defaultSourceId);
  }
}
