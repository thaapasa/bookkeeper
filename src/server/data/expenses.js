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

function expenseSelect(where) {
    return "SELECT MIN(id) AS id, MIN(date) AS date, MIN(receiver) AS receiver, MIN(type) AS type, MIN(sum) AS sum, " +
        "MIN(title) AS title, MIN(description) AS description, BOOL_AND(confirmed) AS confirmed, MIN(source_id) AS source_id, " +
        "MIN(user_id) AS user_id, MIN(created_by_id) AS created_by_id, MIN(group_id) AS group_id, MIN(category_id) AS category_id, " +
        "MIN(created) AS created, MIN(recurring_expense_id) AS recurring_expense_id, " +
        "SUM(cost) AS user_cost, SUM(benefit) AS user_benefit, SUM(income) AS user_income, SUM(split) AS user_split, " +
        "SUM(cost + benefit + income + split) AS user_value " +
        "FROM " +
        "(SELECT id, date::DATE, receiver, e.type, e.sum::MONEY::NUMERIC, title, description, confirmed, " +
        "source_id, e.user_id, created_by_id, group_id, category_id, created, recurring_expense_id, " +
        "(CASE WHEN d.type = 'cost' THEN d.sum::NUMERIC ELSE 0::NUMERIC END) AS cost, " +
        "(CASE WHEN d.type = 'benefit' THEN d.sum::NUMERIC ELSE 0::NUMERIC END) AS benefit, " +
        "(CASE WHEN d.type = 'income' THEN d.sum::NUMERIC ELSE 0::NUMERIC END) AS income, " +
        "(CASE WHEN d.type = 'split' THEN d.sum::NUMERIC ELSE 0::NUMERIC END) AS split " +
        "FROM expenses e " +
        "LEFT JOIN expense_division d ON (d.expense_id = e.id AND d.user_id = $1) " +
        where +
        ") breakdown " +
        "GROUP BY id ORDER BY date ASC, title ASC, id";
}

const countTotalSelect = "SELECT " +
    "COALESCE(SUM(benefit), '0.00'::NUMERIC) as benefit, " +
    "COALESCE(SUM(cost), '0.00'::NUMERIC) AS cost, " +
    "COALESCE(SUM(income), '0.00'::NUMERIC) AS income, " +
    "COALESCE(SUM(split), '0.00'::NUMERIC) AS split " +
    "FROM (SELECT " +
    "(CASE WHEN d.type = 'cost' THEN d.sum::NUMERIC ELSE 0::NUMERIC END) AS cost, " +
    "(CASE WHEN d.type = 'benefit' THEN d.sum::NUMERIC ELSE 0::NUMERIC END) AS benefit, " +
    "(CASE WHEN d.type = 'income' THEN d.sum::NUMERIC ELSE 0::NUMERIC END) AS income, " +
    "(CASE WHEN d.type = 'split' THEN d.sum::NUMERIC ELSE 0::NUMERIC END) AS split " +
    "FROM expenses e " +
    "LEFT JOIN expense_division d ON (d.expense_id = e.id AND d.user_id = $1::INTEGER) " +
    "WHERE group_id=$2::INTEGER AND template=false AND date >= $3::DATE AND date < $4::DATE) breakdown";

function getAll(tx) {
    return (groupId, userId) => tx.queryList("expenses.get_all",
        expenseSelect(`WHERE group_id=$2`),
        [userId, groupId])
        .then(l => l.map(mapExpense));
}

function calculateBalance(o) {
    const value = Money.from(o.cost).plus(o.benefit).plus(o.income).plus(o.split);
    return Object.assign(o, {
        value: value.toString(),
        balance: value.negate().toString()
    })
}

function getByMonth(groupId, userId, year, month) {
    const startDate = time.month(year, month);
    const endDate = startDate.clone().add(1, "months");
    return db.transaction(tx => Promise.all([
        getBetween(tx)(groupId, userId, startDate, endDate),
        countTotalBetween(tx)(groupId, userId, "2000-01", startDate),
        countTotalBetween(tx)(groupId, userId, startDate, endDate),
        hasUnconfirmedBefore(tx)(groupId, startDate)
    ])).then(a => ({ expenses: a[0], startStatus: calculateBalance(a[1]), monthStatus: calculateBalance(a[2]), unconfirmedBefore: a[3] }))
        .then(a => {
            a.endStatus = arrays.toObject(["benefit", "cost", "income", "split", "value", "balance"].map(key =>
                [key, Money.from(a.startStatus[key]).plus(a.monthStatus[key]).toString()]));
            return a;
        });
}

function mapExpense(e) {
    if (e === undefined) throw new errors.NotFoundError("EXPENSE_NOT_FOUND", "expense");
    e.date = moment(e.date).format("YYYY-MM-DD");
    e.userBalance = Money.from(e.userValue).negate().toString();
    return e;
}

function getBetween(tx) {
    return (groupId, userId, startDate, endDate) => {
        log.debug("Querying for expenses between", time.iso(startDate), "and", time.iso(endDate), "for group", groupId);
        return tx.queryList("expenses.get_between",
            expenseSelect(`WHERE group_id=$2 AND template=false AND date >= $3::DATE AND date < $4::DATE`),
            [userId, groupId, time.date(startDate), time.date(endDate)])
            .then(l => l.map(mapExpense));
    }
}

function countTotalBetween(tx) {
    return (groupId, userId, startDate, endDate) => tx.queryObject("expenses.count_total_between",
        countTotalSelect,
        [userId, groupId, time.date(startDate), time.date(endDate)]);
}

function hasUnconfirmedBefore(tx) {
    return (groupId, startDate) => tx.queryObject("expenses.count_unconfirmed_before",
        "SELECT COUNT(*) AS amount FROM expenses WHERE group_id=$1 AND template=false AND date < $2::DATE AND confirmed=false",
        [groupId, startDate])
        .then(s => s.amount > 0);
}

function getById(tx) {
    return (groupId, userId, expenseId) => tx.queryObject("expenses.get_by_id",
        expenseSelect(`WHERE id=$2 AND group_id=$3`),
        [userId, expenseId, groupId])
        .then(mapExpense);
}

function deleteById(tx) {
    return (groupId, expenseId) => tx.update("expenses.delete_by_id", "DELETE FROM expenses WHERE id=$1 AND group_id=$2",
        [expenseId, groupId])
        .then(i => ({ status: "OK", message: "Expense deleted", expenseId: expenseId }));
}

function storeDivision(tx) {
    return (expenseId, userId, type, sum) => tx.insert("expense.create.division",
        "INSERT INTO expense_division (expense_id, user_id, type, sum) " +
        "VALUES ($1::INTEGER, $2::INTEGER, $3::expense_division_type, $4::NUMERIC::MONEY)",
        [expenseId, userId, type, sum.toString()])
}

function deleteDivision(tx) {
    return (expenseId) => tx.insert("expense.delete.division", "DELETE FROM expense_division WHERE expense_id=$1::INTEGER", [expenseId]);
}

function getDivision(tx) {
    return (expenseId) => tx.queryList("expense.get.division",
        "SELECT user_id, type, sum::MONEY::NUMERIC FROM expense_division WHERE expense_id=$1::INTEGER ORDER BY type, user_id",
        [expenseId]);
}

function createDivision(tx) {
    return (expenseId, division) => Promise.all(
        division.map(d => storeDivision(tx)(expenseId, d.userId, d.type, d.sum))).then(u => expenseId)
}

function setDefaults(expense) {
    expense.description = expense.description ? expense.description : null;
    expense.confirmed = typeof expense.confirmed === "undefined" ? true : expense.confirmed;
    return expense;
}

function createExpense(userId, groupId, expense, defaultSourceId) {
    return db.transaction(tx => {
        expense = setDefaults(expense);
        log.info("Creating expense", expense);
        const sourceId = expense.sourceId || defaultSourceId;
        return Promise.all([
            categories.tx.getById(tx)(groupId, expense.categoryId),
            users.tx.getById(tx)(groupId, expense.userId),
            sources.tx.getById(tx)(groupId, sourceId)
        ]).then(a => {
            const cat = a[0];
            const user = a[1];
            const source = a[2];
            const division = expenseDivision.determineDivision(expense, source);
            return insert(tx)(userId, Object.assign({}, expense,
                { userId: user.id, groupId: groupId, sourceId: source.id, categoryId: cat.id, sum: expense.sum.toString() }),
                division);
        }).then(id => ({status: "OK", message: "Expense created", expenseId: id}));
    });
}

function insert(tx) {
    return (userId, expense, division) => tx.insert("expenses.create",
        "INSERT INTO expenses (created_by_id, user_id, group_id, date, created, type, receiver, sum, title, " +
        "description, confirmed, source_id, category_id, template) " +
        "VALUES ($1::INTEGER, $2::INTEGER, $3::INTEGER, $4::DATE, NOW(), $5::expense_type, $6, " +
        "$7::NUMERIC::MONEY, $8, $9, $10::BOOLEAN, $11::INTEGER, $12::INTEGER, $13::BOOLEAN) RETURNING id",
        [userId, expense.userId, expense.groupId, expense.date, expense.type, expense.receiver, expense.sum,
            expense.title, expense.description, expense.confirmed, expense.sourceId, expense.categoryId, expense.template || false])
        .then(expenseId => createDivision(tx)(expenseId, division).then(x => expenseId));
}

function updateExpense(tx) {
    return (original, expense, defaultSourceId) => {
        expense = setDefaults(expense);
        log.info("Updating expense", original, "to", expense);
        const sourceId = expense.sourceId || defaultSourceId;
        return Promise.all([
            categories.tx.getById(tx)(original.groupId, expense.categoryId),
            sources.tx.getById(tx)(original.groupId, sourceId)
        ]).then(a => {
            const cat = a[0];
            const source = a[1];
            const division = expenseDivision.determineDivision(expense, source);
            return deleteDivision(tx)(original.id)
                .then(() => tx.insert("expenses.update",
                    "UPDATE expenses SET date=$2::DATE, receiver=$3, sum=$4::NUMERIC::MONEY, title=$5, description=$6, " +
                    "type=$7::expense_type, confirmed=$8::BOOLEAN, source_id=$9::INTEGER, category_id=$10::INTEGER " +
                    "WHERE id=$1",
                    [original.id, expense.date, expense.receiver, expense.sum.toString(), expense.title,
                        expense.description, expense.type, expense.confirmed, source.id, cat.id]))
                .then(expenseId => createDivision(tx)(original.id, division))
        }).then(id => ({status: "OK", message: "Expense updated", expenseId: id}));
    }
}

function updateExpenseById(groupId, userId, expenseId, expense, defaultSourceId) {
    return db.transaction(tx => getById(tx)(groupId, userId, expenseId)
            .then(e => updateExpense(tx)(e, expense, defaultSourceId))
    )
}

function queryReceivers(tx) {
    return (groupId, receiver) => tx.queryList("expenses.receiver_search",
        "SELECT receiver, COUNT(*) AS AMOUNT FROM expenses WHERE group_id=$1 AND receiver ILIKE $2 " +
        "GROUP BY receiver ORDER BY amount DESC",
        [ groupId, `%${receiver}%` ]);
}

module.exports = {
    getAll: getAll(db),
    getBetween: getBetween(db),
    getByMonth: getByMonth,
    getById: getById(db),
    getDivision: getDivision(db),
    deleteById: deleteById(db),
    create: createExpense,
    update: updateExpenseById,
    queryReceivers: queryReceivers(db),
    tx: {
        getById: getById,
        insert: insert,
        getDivision: getDivision
    }
};
