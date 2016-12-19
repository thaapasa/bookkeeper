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
    e.date = moment(e.date).format("YYYY-MM-DD");
    e.sum = e.sum.substring(1);
    return e;
}

function getBetween(userId, startDate, endDate) {
    return db.queryList("expenses.getBetween",
        "SELECT id, date, receiver, sum, description, source, category, created FROM expenses "+
            "WHERE userId=$1 AND date >= $2 AND date <= $3",
        [userId, startDate, endDate]);
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
    create: createExpense
};
