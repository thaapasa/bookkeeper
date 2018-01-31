import { db, DbAccess } from './Db';
import * as moment from 'moment';
import * as time from '../../shared/util/Time';
import { Validator } from '../util/Validator';
import expenses from './BasicExpenses';
import { RecurringExpensePeriod, Recurrence, ExpenseDivisionItem, Expense } from '../../shared/types/Expense';
import { Moment } from 'moment';
import { ApiMessage } from '../../shared/types/Api';
const debug = require('debug')('bookkeeper:api:recurring-expenses');

function nextRecurrence(fromDate: string | Moment, period: RecurringExpensePeriod): moment.Moment {
  const date = time.fromDate(fromDate);
  switch (period) {
    case 'monthly': return date.add(1, 'month');
    case 'yearly': return date.add(1, 'year');
    default: throw new Validator.InvalidInputError('period', period, 'Unrecognized period type, expected monthly or yearly');
  }
}

function createRecurring(groupId: number, userId: number, expenseId: number, recurrence: Recurrence) {
  return db.transaction(async (tx: DbAccess): Promise<ApiMessage> => {
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
      status: 'OK', message: 'Recurrence created', expenseId: expenseId,
      templateExpenseId: templateId, recurringExpenseId: recurrenceId
    }
  });
}

function getDatesUpTo(recurrence: Recurrence, date: string | Moment): string[] {
  let generating = moment(recurrence.nextMissing);
  const dates: string[] = [];
  while (generating.isBefore(date)) {
    dates.push(time.date(generating));
    generating = nextRecurrence(generating, recurrence.period);
  }
  return dates;
}

function createMissingRecurrences(tx: DbAccess, groupId: number, userId: number, date: string | Moment) {
  return async (recurrence: Recurrence): Promise<void> => {
    const dates = getDatesUpTo(recurrence, date);
    const lastDate = dates[dates.length - 1];
    const nextMissing = nextRecurrence(lastDate, recurrence.period);
    debug('Creating missing expenses for', recurrence, dates);
    const expense = await expenses.tx.getExpenseAndDivision(tx)(groupId, userId, recurrence.templateExpenseId);
    await Promise.all(dates.map(createMissingRecurrenceForDate(tx, expense)));
    await tx.update('expenses.update_recurring_missing_date',
      'UPDATE recurring_expenses SET next_missing=$1::DATE WHERE id=$2',
      [time.date(nextMissing), recurrence.id]);
  }
}

function createMissingRecurrenceForDate(tx: DbAccess, e: [Expense, ExpenseDivisionItem[]]) {
  return (date: string): Promise<number> => {
    const [exp, division] = e;
    const expense = { ...exp, template: false, date };
    debug('Creating missing expense', expense, 'with division', division);
    return expenses.tx.insert(tx)(expense.userId, expense, division);
  }
}

function createMissing(tx: DbAccess) {
  debug('Checking for missing expenses');
  return async (groupId: number, userId: number, date: string | Moment) => {
    const list = await tx.queryList('expenses.find_missing_recurring',
      'SELECT * FROM recurring_expenses WHERE group_id = $1 AND next_missing < $2::DATE',
      [groupId, date]);
    return Promise.all(list.map(createMissingRecurrences(tx, groupId, userId, date)));
  };
}

export default {
  createRecurring: createRecurring,
  tx: {
    createMissing: createMissing
  }
};
