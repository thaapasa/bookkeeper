"use strict";

const db = require("./db");
const log = require("../util/log");
const moment = require("moment");
const time = require("../../shared/util/time");

const expenseSelect = "SELECT id, date::DATE, receiver, sum::MONEY::NUMERIC, description, source, userid, groupid, category, created FROM expenses";
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
    if (e === undefined) throw { status: 404, cause: "Expense not found", code: "EXPENSE_NOT_FOUND" };
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
