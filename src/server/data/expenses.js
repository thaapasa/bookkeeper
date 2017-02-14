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

const expenseSelect = "SELECT id, date::DATE, receiver, e.sum::MONEY::NUMERIC, title, description, confirmed, " +
    "source_id, e.user_id, created_by_id, group_id, category_id, created, " +
    "COALESCE(d1.sum, '0.00'::NUMERIC::MONEY)::MONEY::NUMERIC AS user_benefit, " +
    "COALESCE(d2.sum, '0.00'::NUMERIC::MONEY)::MONEY::NUMERIC AS user_cost, " +
    "(COALESCE(d1.sum, '0.00'::NUMERIC::MONEY) + COALESCE(d2.sum, '0.00'::NUMERIC::MONEY))::MONEY::NUMERIC AS user_value FROM expenses e " +
    "LEFT JOIN expense_division d1 ON (d1.expense_id = e.id AND d1.user_id = $1 AND d1.type='benefit') " +
    "LEFT JOIN expense_division d2 ON (d2.expense_id = e.id AND d2.user_id = $1 AND d2.type='cost')";
const order = "ORDER BY date ASC, title ASC, id";

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
    "WHERE group_id=$2::INTEGER AND date >= $3::DATE AND date < $4::DATE) breakdown";

function getAll(tx) {
    return (groupId, userId) => tx.queryList("expenses.get_all",
        `${expenseSelect} WHERE group_id=$2 ${order}`,
        [userId, groupId])
        .then(l => l.map(mapExpense));
}

function calculateBalance(o) {
    const value = Money.from(o.cost).plus(o.benefit);
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
            a.endStatus = arrays.toObject(["benefit", "cost", "value", "balance"].map(key =>
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
            `${expenseSelect} WHERE group_id=$2 AND date >= $3::DATE AND date < $4::DATE ${order}`,
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
        "SELECT COUNT(*) AS amount FROM expenses WHERE group_id=$1 AND date < $2::DATE AND confirmed=false",
        [groupId, startDate])
        .then(s => s.amount > 0);
}

function getById(tx) {
    return (groupId, userId, expenseId) => tx.queryObject("expenses.get_by_id",
        `${expenseSelect} WHERE id=$2 AND group_id=$3`,
        [userId, expenseId, groupId])
        .then(mapExpense);
}

function deleteById(tx) {
    return (groupId, expenseId) => tx.update("expenses.delete_by_id", "DELETE FROM expenses WHERE id=$1 AND group_id=$2",
        [expenseId, groupId])
        .then(i => ({ status: "OK", message: "Expense deleted", expenseId: expenseId }));
}

function validateDivision(items, sum, field) {
    const calculated = items.map(i => i.sum).reduce((a, b) => a.plus(b), Money.zero);
    if (!sum.equals(calculated)) throw new validator.InvalidInputError(field, calculated,
        `Division sum must match expense sum ${sum.toString()}, is ${calculated.toString()}`);
    return items;
}

function storeDivision(tx) {
    return (expenseId, userId, type, sum) => tx.insert("expense.create.division",
        "INSERT INTO expense_division (expense_id, user_id, type, sum) " +
        "VALUES ($1::INTEGER, $2::INTEGER, $3::expense_type, $4::NUMERIC::MONEY)",
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

function getCostFromSource(sum, source) {
    return splitter.negateDivision(splitter.splitByShares(sum, source.users.map(u => ({ userId: u.userId, share: u.share }))));
}

function createDivision(tx) {
    return (expenseId, benefit, cost) => Promise.all(
        benefit.map(d => storeDivision(tx)(expenseId, d.userId, "benefit", d.sum)).concat(
            cost.map(d => storeDivision(tx)(expenseId, d.userId, "cost", d.sum)))).then(u => expenseId)
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
            const givenCost = expense.division ? expense.division.filter(d => d.type === "cost") : [];
            const givenBenefit = expense.division ? expense.division.filter(d => d.type === "benefit") : [];
            const cost = givenCost.length > 0 ? validateDivision(givenCost, expense.sum.negate(), "cost") : getCostFromSource(expense.sum, source);
            const benefit = givenBenefit.length > 0 ? validateDivision(givenBenefit, expense.sum, "benefit") : splitter.negateDivision(cost);
            return tx.insert("expenses.create",
                "INSERT INTO expenses (created_by_id, user_id, group_id, date, created, receiver, sum, title, description, confirmed, source_id, category_id) " +
                "VALUES ($1::INTEGER, $2::INTEGER, $3::INTEGER, $4::DATE, NOW(), $5, $6::NUMERIC::MONEY, $7, $8, $9::BOOLEAN, $10::INTEGER, $11::INTEGER) RETURNING id",
                [userId, user.id, groupId, expense.date, expense.receiver, expense.sum.toString(), expense.title, expense.description, expense.confirmed,
                    source.id, cat.id])
                .then(expenseId => createDivision(tx)(expenseId, benefit, cost))
        }).then(id => ({status: "OK", message: "Expense created", expenseId: id}));
    });
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
            const givenCost = expense.division ? expense.division.filter(d => d.type === "cost") : [];
            const givenBenefit = expense.division ? expense.division.filter(d => d.type === "benefit") : [];
            const cost = givenCost.length > 0 ? validateDivision(givenCost, expense.sum.negate(), "cost") : getCostFromSource(expense.sum, source);
            const benefit = givenBenefit.length > 0 ? validateDivision(givenBenefit, expense.sum, "benefit") : splitter.negateDivision(cost);
            return deleteDivision(tx)(original.id)
                .then(() => tx.insert("expenses.update",
                    "UPDATE expenses SET date=$2::DATE, receiver=$3, sum=$4::NUMERIC::MONEY, title=$5, description=$6, " +
                    "confirmed=$7::BOOLEAN, source_id=$8::INTEGER, category_id=$9::INTEGER " +
                    "WHERE id=$1",
                    [original.id, expense.date, expense.receiver, expense.sum.toString(), expense.title,
                        expense.description, expense.confirmed, source.id, cat.id]))
                .then(expenseId => createDivision(tx)(original.id, benefit, cost))
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
        "SELECT receiver, COUNT(*) AS AMOUNT FROM expenses WHERE group_id=$1 AND receiver ILIKE $2 GROUP BY receiver ORDER BY amount DESC",
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
        getById: getById
    }
};
