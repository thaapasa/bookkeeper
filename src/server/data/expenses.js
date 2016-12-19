"use strict";

const db = require("./db");
const log = require("../util/log");
const moment = require("moment");

function getAll(userId) {
    return db.queryList("expenses.getAll",
        "SELECT id, date::DATE, receiver, sum, description, source, category, created FROM expenses WHERE userId=$1",
        [userId])
        .then(o => o.map(mapExpense));
}

function mapExpense(e) {
    if (e === undefined) throw { status: 404, cause: "Expense not found", code: "EXPENSE_NOT_FOUND" };
    e.date = moment(e.date).format("YYYY-MM-DD");
    e.sum = e.sum.substring(1);
    return e;
}

function getBetween(userId, startDate, endDate) {
    return db.queryList("expenses.getBetween",
        "SELECT id, date, receiver, sum, description, source, category, created FROM expenses "+
            "WHERE userId=$1 AND date >= $2 AND date <= $3",
        [userId, startDate, endDate])
        .then(o => o.map(mapExpense));
}

function getById(userId, expenseId) {
    return db.queryObject("expenses.getById",
        "SELECT id, date, receiver, sum, description, source, category, created FROM expenses "+
        "WHERE id=$1 AND userId=$2",
        [expenseId, userId])
        .then(mapExpense);
}

function deleteById(userId, expenseId) {
    return db.update("expenses.deleteById", "DELETE FROM expenses WHERE id=$1 AND userId=$2",
        [expenseId, userId])
        .then(i => ({ status: "OK", message: "Expense deleted" }));
}

function createExpense(userId, expense) {
    log.info("Creating expense", expense);
    return db.insert("expenses.create",
        "INSERT INTO expenses (userId, date, created, receiver, sum, description, source, category) " +
            "VALUES ($1, $2::DATE, NOW(), $3, $4::MONEY, $5, $6, $7)",
        [userId, expense.date, expense.receiver, expense.sum, expense.description,
            expense.source, expense.category ])
        .then(i => ({ status: "OK", message: "Expense created" }));
}

module.exports = {
    getAll: getAll,
    getBetween: getBetween,
    getById: getById,
    deleteById: deleteById,
    create: createExpense
};
