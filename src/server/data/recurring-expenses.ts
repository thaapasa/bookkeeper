"use strict";

const db = require("./db");
const log = require("../../shared/util/log");
const moment = require("moment");
const time = require("../../shared/util/time");
const arrays = require("../../shared/util/arrays");
const validator = require("../util/validator");
const Money = require("../../shared/util/money");
const categories = require("./categories");
const users = require("./users");
const sources = require("./sources");
const errors = require("../util/errors");
const splitter = require("../../shared/util/splitter");
const expenseDivision = require("./expense-division");
const expenses = require("./basic-expenses");

function nextRecurrence(fromDate, period) {
    const date = time.fromDate(fromDate);
    if (period === "monthly") {
        return date.add(1, "month");
    }
    else if (period === "yearly") {
        return date.add(1, "year");
    }
    else throw new validator.InvalidInputError("period", period, "Unrecognized period type, expected monthly or yearly");
}

function createRecurring(groupId, userId, expenseId, recurrence) {
    let expense = null;
    let division = null;
    let nextMissing = null;
    let templateId = null;
    let recurrenceId = null;
    return db.transaction(tx => expenses.tx.copyExpense(tx)(groupId, userId, expenseId, e => {
        if (e[0].recurringExpenseId > 0)
            throw new validator.InvalidInputError("recurringExpenseId", e.recurringExpenseId, "Expense is already a recurring expense");
        expense = e[0];
        division = e[1];
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

function getDatesUpTo(recurrence, date) {
    let generating = moment(recurrence.nextMissing);
    const dates = [];
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
        log.debug("Creating missing expenses for", recurrence, dates);
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
        console.log("Creating missing expense", expense, "with division", division);
        return expenses.tx.insert(tx)(expense.userId, expense, division);
    }
}

function createMissing(tx) {
    log.debug("Checking for missing expenses");
    return (groupId, userId, date) => tx.queryList("expenses.find_missing_recurring",
        "SELECT * FROM recurring_expenses WHERE group_id = $1 AND next_missing < $2::DATE",
        [ groupId, date ])
        .then(list => Promise.all(list.map(createMissingRecurrences(tx, groupId, userId, date))));
}

module.exports = {
    createRecurring: createRecurring,
    tx: {
        createMissing: createMissing
    }
};
