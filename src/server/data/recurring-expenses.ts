import { db } from './db';
import * as moment from 'moment';
import * as time from '../../shared/util/time';
import * as arrays from '../../shared/util/arrays';
import { Validator } from '../util/validator';
import Money from '../../shared/util/money';
import categories from './categories';
import users from './users';
import sources from './sources';
import expenses from './basic-expenses';
const debug = require('debug')('bookkeeper:api:recurring-expenses');

function nextRecurrence(fromDate, period): moment.Moment {
    const date = time.fromDate(fromDate);
    if (period === 'monthly') {
        return date.add(1, 'month');
    }
    else if (period === 'yearly') {
        return date.add(1, 'year');
    }
    else throw new Validator.InvalidInputError("period", period, "Unrecognized period type, expected monthly or yearly");
}

function createRecurring(groupId, userId, expenseId, recurrence) {
    let nextMissing: moment.Moment | null = null;
    let templateId: number | null = null;
    let recurrenceId: number | null = null;
    return db.transaction(tx => expenses.tx.copyExpense(tx)(groupId, userId, expenseId, e => {
        if (e[0].recurringExpenseId > 0)
            throw new Validator.InvalidInputError("recurringExpenseId", e.recurringExpenseId, "Expense is already a recurring expense");
        const expense = e[0];
        const division = e[1];
        nextMissing = nextRecurrence(expense.date, recurrence.period);
        return [Object.assign({}, e[0], { template: true }), e[1]];
    })
        .then(id => templateId = id)
        .then(x => tx.insert("expenses.create_recurring_expense",
                "INSERT INTO recurring_expenses (template_expense_id, period, next_missing, group_id) " +
                "VALUES ($1::INTEGER, $2, $3::DATE, $4) RETURNING id",
                [ templateId, recurrence.period, nextMissing, groupId ]))
        .then(id => recurrenceId = id)
        .then(x => tx.update("expenses.set_recurrence_id",
            "UPDATE expenses SET recurring_expense_id=$1 WHERE id IN ($2, $3)", [ recurrenceId, expenseId, templateId ]))
        .then(x => ({ status: "OK", message: "Recurrence created", expenseId: expenseId,
                            templateExpenseId: templateId, recurringExpenseId: recurrenceId })));
}

function getDatesUpTo(recurrence, date): string[] {
    let generating = moment(recurrence.nextMissing);
    const dates: string[] = [];
    while (generating.isBefore(date)) {
        dates.push(time.date(generating));
        generating = nextRecurrence(generating, recurrence.period);
    }
    return dates;
}

function createMissingRecurrences(tx, groupId, userId, date) {
    return (recurrence) => {
        const dates = getDatesUpTo(recurrence, date);
        const lastDate = dates[dates.length - 1];
        const nextMissing = nextRecurrence(lastDate, recurrence.period);
        debug("Creating missing expenses for", recurrence, dates);
        return expenses.tx.getExpenseAndDivision(tx)(groupId, userId, recurrence.templateExpenseId)
            .then(expense => Promise.resolve(dates.map(createMissingRecurrenceForDate(tx, expense))))
            .then(x => tx.update("expenses.update_recurring_missing_date",
                "UPDATE recurring_expenses SET next_missing=$1::DATE WHERE id=$2",
                [ time.date(nextMissing), recurrence.id ]));
    }
}

function createMissingRecurrenceForDate(tx, e) {
    return (date) => {
        const expense = Object.assign({}, e[0], { template: false, date: date });
        const division = e[1];
        debug("Creating missing expense", expense, "with division", division);
        return expenses.tx.insert(tx)(expense.userId, expense, division);
    }
}

function createMissing(tx) {
    debug("Checking for missing expenses");
    return (groupId, userId, date) => tx.queryList("expenses.find_missing_recurring",
        "SELECT * FROM recurring_expenses WHERE group_id = $1 AND next_missing < $2::DATE",
        [ groupId, date ])
        .then(list => Promise.all(list.map(createMissingRecurrences(tx, groupId, userId, date))));
}

export default {
    createRecurring: createRecurring,
    tx: {
        createMissing: createMissing
    }
};
