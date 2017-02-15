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
const expenses = require("./expenses");

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
    return db.transaction(tx => Promise.all([
            expenses.tx.getById(tx)(groupId, userId, expenseId),
            expenses.tx.getDivision(tx)(expenseId)
        ])
        .then(e => {
            if (e[0].recurringExpenseId > 0)
                throw new validator.InvalidInputError("recurringExpenseId", e.recurringExpenseId, "Expense is already a recurring expense");
            return e;
        })
        .then(e => {
            expense = e[0];
            division = e[1];
            nextMissing = nextRecurrence(expense.date, recurrence.period);
            return expenses.tx.insert(tx)(userId, Object.assign({}, expense, { template: true }), division)
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

module.exports = {
    createRecurring: createRecurring
};
