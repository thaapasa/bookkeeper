"use strict";

const db = require("./db");
const log = require("../util/log");
const moment = require("moment");
const time = require("../../shared/util/time");
const validator = require("../util/validator");
const Money = require("../../shared/util/money");
const categories = require("./categories");
const errors = require("../util/errors");

const expenseSelect = "SELECT id, date::DATE, receiver, e.sum::MONEY::NUMERIC, description, source, e.userid, " +
    "groupid, category, created, d1.sum::MONEY::NUMERIC AS benefit, d2.sum::MONEY::NUMERIC AS cost FROM expenses e " +
    "LEFT JOIN expense_division d1 ON (d1.expenseid = e.id AND d1.userid = e.userid AND d1.type='benefit') " +
    "LEFT JOIN expense_division d2 ON (d2.expenseid = e.id AND d2.userid = e.userid AND d2.type='cost')";
const order = "ORDER BY date ASC";

function getAll(groupId) {
    return db.queryList("expenses.getAll",
        `${expenseSelect} WHERE groupid=$1 ${order}`,
        [groupId])
        .then(o => o.map(mapExpense));
}

function getByMonth(groupId, year, month) {
    const startDate = time.month(year, month);
    const endDate = startDate.clone().add(1, "months");
    return getBetween(groupId, startDate, endDate);
}

function mapExpense(e) {
    if (e === undefined) throw new errors.NotFoundError("EXPENSE_NOT_FOUND", "expense");
    e.date = moment(e.date).format("YYYY-MM-DD");
    return e;
}

function getBetween(groupId, startDate, endDate) {
    log.debug("Querying for expenses between", time.iso(startDate), "and", time.iso(endDate), "for group", groupId);
    return db.queryList("expenses.getBetween",
        `${expenseSelect} WHERE groupid=$1 AND date >= $2::DATE AND date < $3::DATE ${order}`,
        [groupId, time.date(startDate), time.date(endDate)])
        .then(o => o.map(mapExpense));
}

function getById(groupId, expenseId) {
    return db.queryObject("expenses.getById",
        `${expenseSelect} WHERE id=$1 AND groupid=$2`,
        [expenseId, groupId])
        .then(mapExpense);
}

function deleteById(groupId, expenseId) {
    return db.update("expenses.deleteById", "DELETE FROM expenses WHERE id=$1 AND groupid=$2",
        [expenseId, groupId])
        .then(i => ({ status: "OK", message: "Expense deleted" }));
}

function validateDivision(items, sum, field) {
    const calculated = items.map(i => i.sum).reduce((a, b) => a.plus(b), Money.zero);
    if (!sum.equals(calculated)) throw new validator.InvalidInputError(field, calculated,
        `Division sum must match expense sum ${sum.toString()}, is ${calculated.toString()}`);
    return items;
}

function storeDivision(expenseId, userId, type, sum) {
    return db.insert("expense.create.division",
        "INSERT INTO expense_division (expenseid, userid, type, sum) " +
        "VALUES ($1::INTEGER, $2::INTEGER, $3::expense_type, $4::MONEY)",
        [expenseId, userId, type, sum.toString()])
}

function createExpense(userId, groupid, expense) {
    log.info("Creating expense", expense);
    const benefit = validateDivision(expense.benefit, expense.sum, "benefit");
    const cost = validateDivision(expense.cost, expense.sum.negate(), "cost");
    return categories.getById(groupid, expense.category)
        .then(cat => db.insert("expenses.create",
        "INSERT INTO expenses (userId, groupId, date, created, receiver, sum, description, source, category) " +
        "VALUES ($1::INTEGER, $2::INTEGER, $3::DATE, NOW(), $4, $5::MONEY, $6, $7, $8::INTEGER) RETURNING id",
        [userId, groupid, expense.date, expense.receiver, expense.sum.toString(), expense.description,
            expense.source, cat.id ]))
        .then(id => Promise.all(
            benefit.map(d => storeDivision(id, userId, "benefit", d.sum)).concat(
                cost.map(d => storeDivision(id, userId, "cost", d.sum)))).then(u => id))
        .then(id => ({ status: "OK", message: "Expense created", expenseId: id }));
}

module.exports = {
    getAll: getAll,
    getBetween: getBetween,
    getByMonth: getByMonth,
    getById: getById,
    deleteById: deleteById,
    create: createExpense
};
