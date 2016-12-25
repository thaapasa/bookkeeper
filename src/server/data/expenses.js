"use strict";

const db = require("./db");
const log = require("../util/log");
const moment = require("moment");
const time = require("../util/time");

const expenseSelect = "SELECT id, date::DATE, receiver, sum, description, source, category, created FROM expenses";

function getAll(userId) {
    return db.queryList("expenses.getAll",
        `${expenseSelect} WHERE userId=$1`,
        [userId])
        .then(o => o.map(mapExpense));
}

function getByMonth(userId, year, month) {
    const startDate = time.month(year, month);
    const endDate = startDate.clone().add(1, "months");
    return getBetween(userId, startDate, endDate);
}

function mapExpense(e) {
    if (e === undefined) throw { status: 404, cause: "Expense not found", code: "EXPENSE_NOT_FOUND" };
    e.date = moment(e.date).format("YYYY-MM-DD");
    e.sum = e.sum.substring(1);
    return e;
}

function getBetween(userId, startDate, endDate) {
    log.debug("Querying for expenses between", time.iso(startDate), "and", time.iso(endDate));
    return db.queryList("expenses.getBetween",
        `${expenseSelect} WHERE userId=$1 AND date >= $2 AND date < $3`,
        [userId, startDate, endDate])
        .then(o => o.map(mapExpense));
}

function getById(userId, expenseId) {
    return db.queryObject("expenses.getById",
        `${expenseSelect} WHERE id=$1 AND userId=$2`,
        [expenseId, userId])
        .then(mapExpense);
}

function deleteById(userId, expenseId) {
    return db.update("expenses.deleteById", "DELETE FROM expenses WHERE id=$1 AND userId=$2",
        [expenseId, userId])
        .then(i => ({ status: "OK", message: "Expense deleted" }));
}

function createExpense(userId, groupId, expense) {
    log.info("Creating expense", expense);
    return db.insert("expenses.create",
        "INSERT INTO expenses (userId, groupId, date, created, receiver, sum, description, source, category) " +
            "VALUES ($1, $2, $3::DATE, NOW(), $4, $5::MONEY, $6, $7, $8)",
        [userId, groupId, expense.date, expense.receiver, expense.sum, expense.description,
            expense.source, expense.category ])
        .then(i => ({ status: "OK", message: "Expense created" }));
}

module.exports = {
    getAll: getAll,
    getBetween: getBetween,
    getByMonth: getByMonth,
    getById: getById,
    deleteById: deleteById,
    create: createExpense
};
