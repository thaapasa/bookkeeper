"use strict";

const db = require("./db");
const log = require("../../shared/util/log");
const moment = require("moment");
const time = require("../../shared/util/time");
const validator = require("../util/validator");
const Money = require("../../shared/util/money");
const categories = require("./categories");
const users = require("./users");
const sources = require("./sources");
const errors = require("../util/errors");
const splitter = require("../../shared/util/splitter");

const expenseSelect = "SELECT id, date::DATE, receiver, e.sum::MONEY::NUMERIC, description, source_id, e.user_id, created_by_id, " +
    "group_id, category_id, created, d1.sum::NUMERIC AS benefit, d2.sum::NUMERIC AS cost FROM expenses e " +
    "LEFT JOIN expense_division d1 ON (d1.expense_id = e.id AND d1.user_id = e.user_id AND d1.type='benefit') " +
    "LEFT JOIN expense_division d2 ON (d2.expense_id = e.id AND d2.user_id = e.user_id AND d2.type='cost')";
const order = "ORDER BY date ASC";

function getAll(groupId) {
    return db.queryList("expenses.get_all",
        `${expenseSelect} WHERE group_id=$1 ${order}`,
        [groupId])
        .then(mapExpense);
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
    return db.queryList("expenses.get_between",
        `${expenseSelect} WHERE group_id=$1 AND date >= $2::DATE AND date < $3::DATE ${order}`,
        [groupId, time.date(startDate), time.date(endDate)])
        .then(mapExpense);
}

function getById(groupId, expenseId) {
    return db.queryObject("expenses.get_by_id",
        `${expenseSelect} WHERE id=$1 AND group_id=$2`,
        [expenseId, groupId])
        .then(mapExpense);
}

function deleteById(groupId, expenseId) {
    return db.update("expenses.delete_by_id", "DELETE FROM expenses WHERE id=$1 AND group_id=$2",
        [expenseId, groupId])
        .then(i => ({ status: "OK", message: "Expense deleted", expenseId: expenseId }));
}

function validateDivision(items, sum, field) {
    const calculated = items.map(i => i.sum).reduce((a, b) => a.plus(b), Money.zero);
    if (!sum.equals(calculated)) throw new validator.InvalidInputError(field, calculated,
        `Division sum must match expense sum ${sum.toString()}, is ${calculated.toString()}`);
    return items;
}

function storeDivision(expenseId, userId, type, sum) {
    return db.insert("expense.create.division",
        "INSERT INTO expense_division (expense_id, user_id, type, sum) " +
        "VALUES ($1::INTEGER, $2::INTEGER, $3::expense_type, $4::NUMERIC::MONEY)",
        [expenseId, userId, type, sum.toString()])
}

function negateSum(s) {
    return Object.assign({}, s, { sum: s.sum.negate() });
}

function getCostFromSource(sum, source) {
    return splitter.splitByShares(sum, source.users.map(u => ({ userId: u.id, share: u.share }))).map(negateSum);
}

function getBenefitFromCost(cost) {
    return cost.map(negateSum);
}

function createExpense(userId, groupId, expense, defaultSourceId) {
    log.info("Creating expense", expense);
    const sourceId = expense.sourceId || defaultSourceId;
    return Promise.all([
        categories.getById(groupId, expense.categoryId),
        users.getById(groupId, expense.userId),
        sources.getById(groupId, sourceId)
    ]).then(a => {
        const cat = a[0];
        const user = a[1];
        const source = a[2];
        const cost = expense.cost ? validateDivision(expense.cost, expense.sum.negate(), "cost") : getCostFromSource(expense.sum, source);
        const benefit = expense.benefit ? validateDivision(expense.benefit, expense.sum, "benefit") : getBenefitFromCost(cost);
        return db.insert("expenses.create",
            "INSERT INTO expenses (created_by_id, user_id, group_id, date, created, receiver, sum, description, source_id, category_id) " +
            "VALUES ($1::INTEGER, $2::INTEGER, $3::INTEGER, $4::DATE, NOW(), $5, $6::NUMERIC::MONEY, $7, $8, $9::INTEGER) RETURNING id",
            [userId, user.id, groupId, expense.date, expense.receiver, expense.sum.toString(), expense.description,
                source.id, cat.id ])
            .then(expenseId => Promise.all(
                benefit.map(d => storeDivision(expenseId, d.userId, "benefit", d.sum)).concat(
                    cost.map(d => storeDivision(expenseId, d.userId, "cost", d.sum)))).then(u => expenseId))
    })
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
