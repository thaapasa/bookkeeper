import debug from 'debug';
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
  RecurringExpenseCriteria,
  RecurringExpenseDetails,
  RecurringExpenseInput,
  RecurringExpenseTarget,
} from 'shared/expense';
import {
  DateLike,
  fromISODate,
  ISODate,
  toISODate,
  toMoment,
} from 'shared/time';
import {
  ApiMessage,
  DbObject,
  InvalidExpense,
  InvalidInputError,
  NotFoundError,
  ObjectId,
} from 'shared/types';
import { camelCaseObject, Money, toArray, unnest } from 'shared/util';

import { BasicExpenseDb } from './BasicExpenseDb';
import { copyExpense } from './BasicExpenseService';
import { CategoryDb } from './CategoryDb';
import { determineDivision } from './ExpenseDivision';
import { SourceDb } from './SourceDb';

const log = debug('bookkeeper:api:recurring-expenses');

const RecurringExpenseSelect = `SELECT *, re.id AS "recurringExpenseId" FROM recurring_expenses re
  LEFT JOIN expenses e ON (e.id = re.template_expense_id)`;

function nextRecurrence(
  from: string | Moment,
  period: RecurrencePeriod
): Moment {
  const date = fromISODate(from);
  return date.add(period.amount, period.unit);
}

async function searchRecurringExpenses(
  tx: ITask<any>,
  groupId: ObjectId,
  userId: ObjectId,
  criteria: RecurringExpenseCriteria = {}
): Promise<RecurringExpense[]> {
  const type = criteria.type && toArray(criteria.type);
  const expenses = await tx.manyOrNone(
    `--sql
    ${RecurringExpenseSelect}
      WHERE re.group_id = $/groupId/
        AND e.group_id = $/groupId/
        ${
          criteria.includeEnded
            ? ''
            : `AND (occurs_until IS NULL OR occurs_until >= NOW())`
        }
        ${criteria.onlyOwn ? `AND user_id = $/userId/` : ''}
        ${type ? 'AND e.type IN ($/type:csv/)' : ''}`,
    { groupId, type, userId }
  );
  return expenses.map(mapRecurringExpense);
}

async function getRecurringExpenseDetails(
  tx: ITask<any>,
  groupId: ObjectId,
  userId: ObjectId,
  recurringExpenseId: ObjectId
): Promise<RecurringExpenseDetails> {
  const row = await tx.oneOrNone(
    `--sql
    ${RecurringExpenseSelect}
      WHERE re.group_id = $/groupId/
        AND e.group_id = $/groupId/
        AND re.id = $/recurringExpenseId/`,
    { groupId, recurringExpenseId }
  );
  if (!row) {
    throw new NotFoundError(
      'RECURRING_EXPENSE_NOT_FOUND',
      `Recurring expense`,
      recurringExpenseId
    );
  }
  const recurringExpense = mapRecurringExpense(row);
  const totals = await tx.one(
    `SELECT COUNT(*) AS "count", SUM(sum) AS "sum" FROM expenses WHERE recurring_expense_id=$/recurringExpenseId/`,
    { recurringExpenseId }
  );
  const [firstOccurence, lastOccurence] = await Promise.all([
    BasicExpenseDb.getFirstRecurrence(tx, groupId, userId, recurringExpenseId),
    BasicExpenseDb.getLastRecurrence(tx, groupId, userId, recurringExpenseId),
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
    templateExpenseId: row.template_expense_id,
    title: row.title,
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

async function createRecurring(
  tx: ITask<any>,
  groupId: ObjectId,
  userId: ObjectId,
  expenseId: ObjectId,
  recurrence: RecurringExpenseInput
): Promise<ApiMessage> {
  log(
    `Create recurring expense with a period of ${recurrence.period.amount} ${recurrence.period.unit} from ${expenseId}`
  );
  let nextMissing: Moment | undefined;
  const templateId = await copyExpense(tx, groupId, userId, expenseId, e => {
    const [expense, division] = e;
    if (expense.recurringExpenseId && expense.recurringExpenseId > 0) {
      throw new InvalidInputError(
        'INVALID_INPUT',
        `Expense ${expenseId} is already a recurring expense (${expense.recurringExpenseId})`
      );
    }
    nextMissing = nextRecurrence(expense.date, recurrence.period);
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
      }
    )
  ).id;

  await tx.none(
    `UPDATE expenses
        SET recurring_expense_id=$/recurringExpenseId/
        WHERE id IN ($/expenseId/, $/templateId/)`,
    { recurringExpenseId, expenseId, templateId }
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
    generating = nextRecurrence(generating, recurrence.period);
  }
  return dates;
}

function createMissingRecurrenceForDate(
  tx: ITask<any>,
  e: [Expense, ExpenseDivisionItem[]],
  date: string
): Promise<number> {
  const [exp, division] = e;
  const expense = { ...exp, template: false, date };
  log('Creating missing expense', expense.title, expense.date);
  // log('Creating missing expense', expense, 'with division', division);
  return BasicExpenseDb.insert(tx, expense.userId, expense, division);
}

async function createMissingRecurrences(
  tx: ITask<any>,
  groupId: number,
  userId: number,
  date: Moment,
  recurrenceDb: RecurrenceInDb
) {
  const recurrence: Recurrence = {
    ...recurrenceDb,
    period: {
      amount: recurrenceDb.periodAmount,
      unit: recurrenceDb.periodUnit,
    },
  };
  const until = recurrence.occursUntil
    ? toMoment(recurrence.occursUntil)
    : null;
  const maxDate = until && until.isBefore(date) ? until : toMoment(date);
  const dates = getDatesUpTo(recurrence, maxDate);
  if (dates.length < 1) {
    return;
  }
  const lastDate = dates[dates.length - 1];
  const nextMissing = nextRecurrence(lastDate, recurrence.period);
  log(
    'Creating missing expenses for',
    recurrence,
    dates,
    'next missing is',
    toISODate(nextMissing)
  );
  const expense = await BasicExpenseDb.getExpenseAndDivision(
    tx,
    groupId,
    userId,
    recurrence.templateExpenseId
  );
  await tx.batch(
    dates.map(date => createMissingRecurrenceForDate(tx, expense, date))
  );
  await tx.none(
    `UPDATE recurring_expenses
        SET next_missing=$/nextMissing/::DATE
        WHERE id=$/recurringExpenseId/`,
    {
      nextMissing: toISODate(nextMissing),
      recurringExpenseId: recurrence.id,
    }
  );
}

interface RecurrenceInDb
  extends DbObject,
    Omit<RecurringExpenseInput, 'period'> {
  nextMissing: ISODate;
  templateExpenseId: number;
  periodAmount: number;
  periodUnit: RecurrenceUnit;
}

async function createMissing(
  tx: ITask<any>,
  groupId: number,
  userId: number,
  date: Moment
): Promise<void> {
  log('Checking for missing expenses');
  const list = await tx.map<RecurrenceInDb>(
    `SELECT *
        FROM recurring_expenses
        WHERE group_id=$/groupId/ AND next_missing < $/nextMissing/::DATE`,
    { groupId, nextMissing: date },
    camelCaseObject
  );
  await tx.batch(
    list.map(v => createMissingRecurrences(tx, groupId, userId, date, v))
  );
}

async function deleteRecurrenceAndExpenses(
  tx: ITask<any>,
  recurringExpenseId: number
): Promise<ApiMessage> {
  const [expenseCount] = await Promise.all([
    tx.none(
      `DELETE FROM expenses WHERE recurring_expense_id=$/recurringExpenseId/`,
      { recurringExpenseId }
    ),
    tx.none(`DELETE FROM recurring_expenses WHERE id=$/recurringExpenseId/`, {
      recurringExpenseId,
    }),
  ]);
  return {
    status: 'OK',
    message: `All ${expenseCount} expense(s) belonging to recurrence ${recurringExpenseId} have been deleted`,
  };
}

async function deleteRecurrenceAfter(
  tx: ITask<any>,
  expenseId: number,
  afterDate: DateLike,
  recurringExpenseId: number
): Promise<ApiMessage> {
  const [expenseCount] = await Promise.all([
    tx.none(
      `DELETE FROM expenses
        WHERE recurring_expense_id=$/recurringExpenseId/ AND (id=$/expenseId/ OR date > $/afterDate/::date)`,
      { recurringExpenseId, expenseId, afterDate }
    ),
    tx.none(
      `UPDATE recurring_expenses
        SET occurs_until=$/afterDate/::date
        WHERE id=$/recurringExpenseId/`,
      { recurringExpenseId, afterDate }
    ),
  ]);
  return {
    status: 'OK',
    message: `${expenseCount} expense(s) on or after ${afterDate} belonging to recurrence ${recurringExpenseId} have been deleted`,
  };
}

async function deleteRecurringById(
  tx: ITask<any>,
  groupId: number,
  userId: number,
  expenseId: number,
  target: RecurringExpenseTarget
): Promise<ApiMessage> {
  log('Deleting recurring expense', expenseId, '- targeting', target);
  if (target === 'single') {
    return BasicExpenseDb.deleteById(tx, groupId, expenseId);
  }
  const exp = await BasicExpenseDb.getById(tx, groupId, userId, expenseId);
  if (!exp.recurringExpenseId) {
    throw new InvalidExpense('Not a recurring expense');
  }
  switch (target) {
    case 'all':
      return deleteRecurrenceAndExpenses(tx, exp.recurringExpenseId);
    case 'after':
      return deleteRecurrenceAfter(
        tx,
        expenseId,
        exp.date,
        exp.recurringExpenseId
      );
    default:
      throw new InvalidExpense(`Invalid target ${target}`);
  }
}

function deleteDivisionForRecurrence(
  tx: ITask<any>,
  recurringExpenseId: number,
  afterDate: DateLike | null
): Promise<null> {
  return tx.none(
    `DELETE FROM expense_division
      WHERE expense_id IN (
        SELECT id FROM expenses
        WHERE recurring_expense_id=$/recurringExpenseId/::INTEGER
          AND (template=true OR $/afterDate/::DATE IS NULL OR date >= $/afterDate/::DATE)
      )`,
    { recurringExpenseId, afterDate }
  );
}

async function getRecurringExpenseIds(
  tx: ITask<any>,
  recurringExpenseId: number,
  afterDate: DateLike | null
): Promise<number[]> {
  return (
    await tx.manyOrNone<{ id: number }>(
      `SELECT id
        FROM expenses
        WHERE recurring_expense_id=$/recurringExpenseId/
          AND (template=true OR $/afterDate/::DATE IS NULL OR date >= $/afterDate/::DATE)`,
      { recurringExpenseId, afterDate }
    )
  ).map(e => e.id);
}

async function createDivisionForRecurrence(
  tx: ITask<any>,
  recurringExpenseId: number,
  division: ExpenseDivisionItem[],
  afterDate: DateLike | null
): Promise<number> {
  const ids = await getRecurringExpenseIds(tx, recurringExpenseId, afterDate);
  await Promise.all(
    unnest(
      ids.map(expenseId =>
        division.map(d =>
          BasicExpenseDb.storeDivision(tx, expenseId, d.userId, d.type, d.sum)
        )
      )
    )
  );
  return recurringExpenseId;
}

async function updateRecurringExpense(
  tx: ITask<any>,
  target: RecurringExpenseTarget,
  original: Expense,
  expenseInput: ExpenseInput,
  defaultSourceId: number
): Promise<ApiMessage> {
  if (!original.recurringExpenseId) {
    throw new InvalidExpense(`Invalid target ${target}`);
  }
  const expense = BasicExpenseDb.setDefaults(expenseInput);
  log('Updating recurring expense', original, 'to', expense);
  const sourceId = expense.sourceId || defaultSourceId;
  const [cat, source] = await Promise.all([
    CategoryDb.getById(tx, original.groupId, expense.categoryId),
    SourceDb.getById(tx, original.groupId, sourceId),
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
    }
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
    }
  );
  await deleteDivisionForRecurrence(tx, original.recurringExpenseId, afterDate);
  await createDivisionForRecurrence(
    tx,
    original.recurringExpenseId,
    division,
    afterDate
  );
  return {
    status: 'OK',
    message: 'Recurring expenses updated',
    expenseId: original.id,
    recurringExpenseId: original.recurringExpenseId,
  };
}

async function updateRecurring(
  tx: ITask<any>,
  groupId: number,
  userId: number,
  expenseId: number,
  target: RecurringExpenseTarget,
  expense: ExpenseInput,
  defaultSourceId: number
): Promise<ApiMessage> {
  log(`Updating recurring expense ${expenseId} - targeting ${target}`);
  const org = await BasicExpenseDb.getById(tx, groupId, userId, expenseId);
  if (!org.recurringExpenseId) {
    throw new InvalidExpense(`${expenseId} is not a recurring expense`);
  }

  if (target === 'single') {
    return BasicExpenseDb.update(tx, org, expense, defaultSourceId);
  } else {
    return updateRecurringExpense(tx, target, org, expense, defaultSourceId);
  }
}

export const RecurringExpenseDb = {
  searchRecurringExpenses,
  nextRecurrence,
  createRecurring,
  deleteRecurringById,
  updateRecurring,
  createMissing,
  getRecurringExpenseDetails,
};
