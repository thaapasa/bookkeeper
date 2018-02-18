import { db, DbAccess } from './Db';
import moment, { Moment } from 'moment';
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
const debug = require('debug')('bookkeeper:api:recurring-expenses');

function nextRecurrence(from: string | Moment, period: RecurringExpensePeriod): moment.Moment {
  const date = fromDate(from);
  switch (period) {
    case 'monthly': return date.add(1, 'month');
    case 'yearly': return date.add(1, 'year');
    default: throw new Validator.InvalidInputError('period', period, 'Unrecognized period type, expected monthly or yearly');
  }
}

function createRecurring(groupId: number, userId: number, expenseId: number, recurrence: Recurrence) {
  return db.transaction(async (tx: DbAccess): Promise<ApiMessage> => {
    debug('Create', recurrence.period, 'recurring expense from', expenseId);
    let nextMissing: moment.Moment | null = null;
    const templateId = await expenses.tx.copyExpense(tx)(groupId, userId, expenseId, e => {
      const [expense, division] = e;
      if (expense.recurringExpenseId && expense.recurringExpenseId > 0) {
        throw new Validator.InvalidInputError('recurringExpenseId', expense.recurringExpenseId, 'Expense is already a recurring expense');
      }
      nextMissing = nextRecurrence(expense.date, recurrence.period);
      return [{ ...expense, template: true }, division];
    });
    const recurrenceId = await tx.insert('expenses.create_recurring_expense',
      'INSERT INTO recurring_expenses (template_expense_id, period, next_missing, group_id) ' +
      'VALUES ($1::INTEGER, $2, $3::DATE, $4) RETURNING id',
      [templateId, recurrence.period, nextMissing, groupId]);

    await tx.update('expenses.set_recurrence_id',
      'UPDATE expenses SET recurring_expense_id=$1 WHERE id IN ($2, $3)', [recurrenceId, expenseId, templateId]);
    return {
      status: 'OK', message: 'Recurrence created', expenseId,
      templateExpenseId: templateId, recurringExpenseId: recurrenceId,
    };
  });
}

function getDatesUpTo(recurrence: Recurrence, date: Moment): string[] {
  let generating = moment(recurrence.nextMissing);
  const dates: string[] = [];
  while (generating.isBefore(date)) {
    dates.push(formatDate(generating));
    generating = nextRecurrence(generating, recurrence.period);
  }
  return dates;
}

function createMissingRecurrences(tx: DbAccess, groupId: number, userId: number, date: Moment) {
  return async (recurrence: Recurrence): Promise<void> => {
    const until = recurrence.occursUntil ? toMoment(recurrence.occursUntil) : null;
    const maxDate = until && until.isBefore(date) ? until : toMoment(date);
    const dates = getDatesUpTo(recurrence, maxDate);
    if (dates.length < 1) { return; }
    const lastDate = dates[dates.length - 1];
    const nextMissing = nextRecurrence(lastDate, recurrence.period);
    debug('Creating missing expenses for', recurrence, dates, 'next missing is', nextMissing);
    const expense = await expenses.tx.getExpenseAndDivision(tx)(groupId, userId, recurrence.templateExpenseId);
    await Promise.all(dates.map(createMissingRecurrenceForDate(tx, expense)));
    await tx.update('expenses.update_recurring_missing_date',
      'UPDATE recurring_expenses SET next_missing=$1::DATE WHERE id=$2',
      [formatDate(nextMissing), recurrence.id]);
  };
}

function createMissingRecurrenceForDate(tx: DbAccess, e: [Expense, ExpenseDivisionItem[]]) {
  return (date: string): Promise<number> => {
    const [exp, division] = e;
    const expense = { ...exp, template: false, date };
    debug('Creating missing expense', expense.title, expense.date);
    // debug('Creating missing expense', expense, 'with division', division);
    return expenses.tx.insert(tx)(expense.userId, expense, division);
  };
}

function createMissing(tx: DbAccess) {
  debug('Checking for missing expenses');
  return async (groupId: number, userId: number, date: Moment) => {
    const list = await tx.queryList<Recurrence>('expenses.find_missing_recurring',
      'SELECT * FROM recurring_expenses WHERE group_id = $1 AND next_missing < $2::DATE',
      [groupId, date]);
    return Promise.all(list.map(createMissingRecurrences(tx, groupId, userId, date)));
  };
}

async function deleteRecurrenceAndExpenses(tx: DbAccess, recurringExpenseId: number): Promise<ApiMessage> {
  const [expenseCount] = await Promise.all([
    tx.update('expenses.delete_recurrence_expenses',
      'DELETE FROM expenses WHERE recurring_expense_id=$1', [recurringExpenseId]),
    tx.update('expenses.delete_recurrence_master',
      'DELETE FROM recurring_expenses WHERE id=$1', [recurringExpenseId]),
  ]);
  return { status: 'OK', message: `All ${expenseCount} expense(s) belonging to recurrence ${recurringExpenseId} have been deleted` };
}

async function deleteRecurrenceAfter(tx: DbAccess, expenseId: number, afterDate: DateLike, recurringExpenseId: number): Promise<ApiMessage> {
  const [expenseCount] = await Promise.all([
    tx.update('expenses.delete_recurrence_expenses_after',
      'DELETE FROM expenses WHERE recurring_expense_id=$1 AND (id=$2 OR date > $3::date)', [recurringExpenseId, expenseId, afterDate]),
    tx.update('expenses.delete_recurrence_master',
      'UPDATE recurring_expenses SET occurs_until=$2::date WHERE id=$1', [recurringExpenseId, afterDate]),
  ]);
  return { status: 'OK', message: `${expenseCount} expense(s) on or after ${afterDate} belonging to recurrence ${recurringExpenseId} have been deleted` };
}

async function deleteRecurringById(groupId: number, userId: number, expenseId: number, target: RecurringExpenseTarget): Promise<ApiMessage> {
  return db.transaction(async (tx) => {
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

function deleteDivisionForRecurrence(tx: DbAccess, recurringExpenseId: number, afterDate: DateLike | null): Promise<number> {
  return tx.insert('expenses.delete.division_recurrence', `
DELETE FROM expense_division WHERE expense_id IN (
  SELECT id FROM expenses
  WHERE recurring_expense_id=$1::INTEGER
  AND (template=true OR $2::DATE IS NULL OR date >= $2::DATE)
)`,
    [recurringExpenseId, afterDate]);
}

async function createDivisionForRecurrence(tx: DbAccess, recurringExpenseId: number, division: ExpenseDivisionItem[], afterDate: DateLike | null): Promise<number> {
  const ids = await getRecurringExpenseIds(tx, recurringExpenseId, afterDate);
  await Promise.all(flatten(ids.map(expenseId => division.map(d => storeDivision(tx)(expenseId, d.userId, d.type, d.sum)))));
  return recurringExpenseId;
}

async function getRecurringExpenseIds(tx: DbAccess, recurringExpenseId: number, afterDate: DateLike | null): Promise<number[]> {
  return (await tx.queryList<{ id: number }>('expenses.select.ids_recurrence',
    'SELECT id FROM expenses WHERE recurring_expense_id=$1 AND (template=true OR $2::DATE IS NULL OR date >= $2::DATE)',
    [recurringExpenseId, afterDate])).map(e => e.id);
}

async function updateRecurringExpense(tx: DbAccess, target: RecurringExpenseTarget, original: Expense, expense: Expense, defaultSourceId: number): Promise<ApiMessage> {
  if (!original.recurringExpenseId) { throw new InvalidExpense(`Invalid target ${target}`); }
  expense = setDefaults(expense);
  debug('Updating recurring expense', original, 'to', expense);
  const sourceId = expense.sourceId || defaultSourceId;
  const [cat, source] = await Promise.all([
    categories.tx.getById(tx)(original.groupId, expense.categoryId),
    sources.tx.getById(tx)(original.groupId, sourceId),
  ]);
  await tx.insert('expenses.update_single_recurring',
    'UPDATE expenses SET date=$2::DATE, receiver=$3, sum=$4::NUMERIC::MONEY, title=$5, description=$6, ' +
    'type=$7::expense_type, confirmed=$8::BOOLEAN, source_id=$9::INTEGER, category_id=$10::INTEGER ' +
    'WHERE id=$1',
    [original.id, expense.date, expense.receiver, expense.sum.toString(), expense.title,
    expense.description, expense.type, expense.confirmed, source.id, cat.id]);
  const division = determineDivision(expense, source);
  const afterDate = target === 'after' ? original.date : null;
  await tx.insert('expenses.update_all_recurring',
    'UPDATE expenses SET receiver=$3, sum=$4::NUMERIC::MONEY, title=$5, description=$6, ' +
    'type=$7::expense_type, confirmed=$8::BOOLEAN, source_id=$9::INTEGER, category_id=$10::INTEGER ' +
    'WHERE recurring_expense_id=$1 AND (template = true OR $2::DATE IS NULL OR date >= $2::DATE)',
    [original.recurringExpenseId, afterDate, expense.receiver, expense.sum.toString(), expense.title,
    expense.description, expense.type, expense.confirmed, source.id, cat.id]);
  await deleteDivisionForRecurrence(tx, original.recurringExpenseId, afterDate);
  await createDivisionForRecurrence(tx, original.recurringExpenseId, division, afterDate);
  return { status: 'OK', message: 'Recurring expenses updated', expenseId: original.id, recurringExpenseId: original.recurringExpenseId };

}

async function updateRecurring(
  groupId: number, userId: number, expenseId: number, target: RecurringExpenseTarget,
  expense: Expense, defaultSourceId: number): Promise<ApiMessage> {
  return db.transaction(async (tx) => {
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
