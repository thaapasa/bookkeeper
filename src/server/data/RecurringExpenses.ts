import { db } from './Db';
import { Moment } from 'moment';
import { Validator } from '../util/Validator';
import expenses, { setDefaults, storeDivision } from './BasicExpenses';
import { RecurringExpensePeriod, Recurrence, ExpenseDivisionItem, Expense, RecurringExpenseTarget } from '../../shared/types/Expense';
import { ApiMessage } from '../../shared/types/Api';
import { formatDate, fromDate, DateLike, toMoment } from '../../shared/util/Time';
import { InvalidExpense } from '../../shared/types/Errors';
import categories from './Categories';
import sources from './Sources';
import { determineDivision } from './ExpenseDivision';
import { flatten } from '../../shared/util/Arrays';
import { IBaseProtocol } from '../../../node_modules/pg-promise';
import { camelCaseObject } from '../../shared/util/Util';
const debug = require('debug')('bookkeeper:api:recurring-expenses');

export function nextRecurrence(from: string | Moment, period: RecurringExpensePeriod): Moment {
  const date = fromDate(from);
  switch (period) {
    case 'monthly': return date.add(1, 'month');
    case 'yearly': return date.add(1, 'year');
    default: throw new Validator.InvalidInputError('period', period, 'Unrecognized period type, expected monthly or yearly');
  }
}

function createRecurring(groupId: number, userId: number, expenseId: number, recurrence: Recurrence) {
  return db.tx(async (tx: IBaseProtocol<any>): Promise<ApiMessage> => {
    debug('Create', recurrence.period, 'recurring expense from', expenseId);
    let nextMissing: Moment | null = null;
    const templateId = await expenses.tx.copyExpense(tx)(groupId, userId, expenseId, e => {
      const [expense, division] = e;
      if (expense.recurringExpenseId && expense.recurringExpenseId > 0) {
        throw new Validator.InvalidInputError('recurringExpenseId', expense.recurringExpenseId, 'Expense is already a recurring expense');
      }
      nextMissing = nextRecurrence(expense.date, recurrence.period);
      return [{ ...expense, template: true }, division];
    });
    const recurringExpenseId = (await tx.one<{ id: number }>(`
INSERT INTO recurring_expenses (template_expense_id, period, next_missing, group_id)
VALUES ($/templateId/::INTEGER, $/period/, $/nextMissing/::DATE, $/groupId/)
RETURNING id`,
      { templateId, period: recurrence.period, nextMissing: formatDate(nextMissing), groupId })).id;

    await tx.none(`
UPDATE expenses
SET recurring_expense_id=$/recurringExpenseId/
WHERE id IN ($/expenseId/, $/templateId/)`,
      { recurringExpenseId, expenseId, templateId },
    );
    return {
      status: 'OK', message: 'Recurrence created', expenseId,
      templateExpenseId: templateId, recurringExpenseId,
    };
  });
}

function getDatesUpTo(recurrence: Recurrence, date: Moment): string[] {
  let generating = toMoment(recurrence.nextMissing);
  const dates: string[] = [];
  while (generating.isBefore(date)) {
    dates.push(formatDate(generating));
    generating = nextRecurrence(generating, recurrence.period);
  }
  return dates;
}

function createMissingRecurrences(tx: IBaseProtocol<any>, groupId: number, userId: number, date: Moment) {
  return async (recurrence: Recurrence): Promise<void> => {
    const until = recurrence.occursUntil ? toMoment(recurrence.occursUntil) : null;
    const maxDate = until && until.isBefore(date) ? until : toMoment(date);
    const dates = getDatesUpTo(recurrence, maxDate);
    if (dates.length < 1) { return; }
    const lastDate = dates[dates.length - 1];
    const nextMissing = nextRecurrence(lastDate, recurrence.period);
    debug('Creating missing expenses for', recurrence, dates, 'next missing is', formatDate(nextMissing));
    const expense = await expenses.tx.getExpenseAndDivision(tx)(groupId, userId, recurrence.templateExpenseId);
    await Promise.all(dates.map(createMissingRecurrenceForDate(tx, expense)));
    await tx.none(`
UPDATE recurring_expenses
SET next_missing=$/nextMissing/::DATE
WHERE id=$/recurringExpenseId/`,
      { nextMissing: formatDate(nextMissing), recurringExpenseId: recurrence.id },
    );
  };
}

function createMissingRecurrenceForDate(tx: IBaseProtocol<any>, e: [Expense, ExpenseDivisionItem[]]) {
  return (date: string): Promise<number> => {
    const [exp, division] = e;
    const expense = { ...exp, template: false, date };
    debug('Creating missing expense', expense.title, expense.date);
    // debug('Creating missing expense', expense, 'with division', division);
    return expenses.tx.insert(tx)(expense.userId, expense, division);
  };
}

function createMissing(tx: IBaseProtocol<any>) {
  debug('Checking for missing expenses');
  return async (groupId: number, userId: number, date: Moment) => {
    const list = await tx.map<Recurrence>(`
SELECT *
FROM recurring_expenses
WHERE group_id=$/groupId/ AND next_missing < $/nextMissing/::DATE`,
      { groupId, nextMissing: date },
      camelCaseObject,
    );
    return Promise.all(list.map(createMissingRecurrences(tx, groupId, userId, date)));
  };
}

async function deleteRecurrenceAndExpenses(tx: IBaseProtocol<any>, recurringExpenseId: number): Promise<ApiMessage> {
  const [expenseCount] = await Promise.all([
    tx.none(
      `DELETE FROM expenses WHERE recurring_expense_id=$/recurringExpenseId/`,
      { recurringExpenseId },
    ),
    tx.none(
      `DELETE FROM recurring_expenses WHERE id=$/recurringExpenseId/`,
      { recurringExpenseId },
    ),
  ]);
  return {
    status: 'OK',
    message: `All ${expenseCount} expense(s) belonging to recurrence ${recurringExpenseId} have been deleted`,
  };
}

async function deleteRecurrenceAfter(tx: IBaseProtocol<any>, expenseId: number, afterDate: DateLike, recurringExpenseId: number): Promise<ApiMessage> {
  const [expenseCount] = await Promise.all([
    tx.none(`
DELETE FROM expenses
WHERE recurring_expense_id=$/recurringExpenseId/ AND (id=$/expenseId/ OR date > $/afterDate/::date)`,
      { recurringExpenseId, expenseId, afterDate },
    ),
    tx.none(`
UPDATE recurring_expenses
SET occurs_until=$/afterDate/::date
WHERE id=$/recurringExpenseId/`,
      { recurringExpenseId, afterDate }),
    ]);
  return {
    status: 'OK',
    message: `${expenseCount} expense(s) on or after ${afterDate} belonging to recurrence ${recurringExpenseId} have been deleted`,
  };
}

async function deleteRecurringById(groupId: number, userId: number, expenseId: number, target: RecurringExpenseTarget): Promise<ApiMessage> {
  return db.tx(async tx => {
    debug('Deleting recurring expense', expenseId, '- targeting', target);
    if (target === 'single') { return expenses.deleteById(groupId, expenseId); }
    const exp = await expenses.tx.getById(tx)(groupId, userId, expenseId);
    if (!exp.recurringExpenseId) { throw new InvalidExpense('Not a recurring expense'); }
    switch (target) {
      case 'all': return deleteRecurrenceAndExpenses(tx, exp.recurringExpenseId);
      case 'after': return deleteRecurrenceAfter(tx, expenseId, exp.date, exp.recurringExpenseId);
    }
    throw new InvalidExpense(`Invalid target ${target}`);
  });
}

function deleteDivisionForRecurrence(tx: IBaseProtocol<any>, recurringExpenseId: number, afterDate: DateLike | null): Promise<null> {
  return tx.none(`
DELETE FROM expense_division WHERE expense_id IN (
  SELECT id FROM expenses
  WHERE recurring_expense_id=$/recurringExpenseId/::INTEGER
    AND (template=true OR $/afterDate/::DATE IS NULL OR date >= $/afterDate/::DATE)
)`,
    { recurringExpenseId, afterDate });
}

async function createDivisionForRecurrence(tx: IBaseProtocol<any>, recurringExpenseId: number, division: ExpenseDivisionItem[], afterDate: DateLike | null): Promise<number> {
  const ids = await getRecurringExpenseIds(tx, recurringExpenseId, afterDate);
  await Promise.all(flatten(ids.map(expenseId => division.map(d => storeDivision(tx)(expenseId, d.userId, d.type, d.sum)))));
  return recurringExpenseId;
}

async function getRecurringExpenseIds(tx: IBaseProtocol<any>, recurringExpenseId: number, afterDate: DateLike | null): Promise<number[]> {
  return (await tx.manyOrNone<{ id: number }>(`
SELECT id
FROM expenses
WHERE recurring_expense_id=$/recurringExpenseId/
  AND (template=true OR $/afterDate/::DATE IS NULL OR date >= $/afterDate/::DATE)`,
    { recurringExpenseId, afterDate })).map(e => e.id);
}

async function updateRecurringExpense(tx: IBaseProtocol<any>, target: RecurringExpenseTarget, original: Expense, expense: Expense, defaultSourceId: number): Promise<ApiMessage> {
  if (!original.recurringExpenseId) { throw new InvalidExpense(`Invalid target ${target}`); }
  expense = setDefaults(expense);
  debug('Updating recurring expense', original, 'to', expense);
  const sourceId = expense.sourceId || defaultSourceId;
  const [cat, source] = await Promise.all([
    categories.tx.getById(tx)(original.groupId, expense.categoryId),
    sources.tx.getById(tx)(original.groupId, sourceId),
  ]);
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
  const division = determineDivision(expense, source);
  const afterDate = target === 'after' ? original.date : null;
  await tx.none(`
UPDATE expenses
SET receiver=$/receiver/, sum=$/sum/::NUMERIC::MONEY, title=$/title/, description=$/description/,
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
    });
  await deleteDivisionForRecurrence(tx, original.recurringExpenseId, afterDate);
  await createDivisionForRecurrence(tx, original.recurringExpenseId, division, afterDate);
  return { status: 'OK', message: 'Recurring expenses updated', expenseId: original.id, recurringExpenseId: original.recurringExpenseId };

}

async function updateRecurring(
  groupId: number, userId: number, expenseId: number, target: RecurringExpenseTarget,
  expense: Expense, defaultSourceId: number): Promise<ApiMessage> {
  return db.tx(async tx => {
    debug('Updating recurring expense', expenseId, '- targeting', target);
    const org = await expenses.tx.getById(tx)(groupId, userId, expenseId);
    if (!org.recurringExpenseId) { throw new InvalidExpense('Not a recurring expense'); }

    if (target === 'single') {
      return expenses.tx.updateExpense(tx)(org, expense, defaultSourceId);
    } else {
      return updateRecurringExpense(tx, target, org, expense, defaultSourceId);
    }
  });
}

export default {
  createRecurring,
  deleteRecurringById,
  updateRecurring,
  tx: {
    createMissing,
  },
};
