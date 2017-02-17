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
const recurring = require("./recurring-expenses");
const basic = require("./basic-expenses");

function calculateBalance(o) {
    const value = Money.from(o.cost).plus(o.benefit).plus(o.income).plus(o.split);
    return Object.assign(o, {
        value: value.toString(),
        balance: value.negate().toString()
    })
}

function getBetween(tx) {
    return (groupId, userId, startDate, endDate) => {
        log.debug("Querying for expenses between", time.iso(startDate), "and", time.iso(endDate), "for group", groupId);
        return tx.queryList("expenses.get_between",
            basic.expenseSelect(`WHERE group_id=$2 AND template=false AND date >= $3::DATE AND date < $4::DATE`),
            [userId, groupId, time.date(startDate), time.date(endDate)])
            .then(l => l.map(basic.mapExpense));
    }
}

function getByMonth(groupId, userId, year, month) {
    const startDate = time.month(year, month);
    const endDate = startDate.clone().add(1, "months");
    return db.transaction(tx => recurring.tx.createMissing(tx)(groupId, userId, endDate)
        .then(x => Promise.all([
            getBetween(tx)(groupId, userId, startDate, endDate),
            basic.tx.countTotalBetween(tx)(groupId, userId, "2000-01", startDate),
            basic.tx.countTotalBetween(tx)(groupId, userId, startDate, endDate),
            basic.tx.hasUnconfirmedBefore(tx)(groupId, startDate)
        ])))
        .then(a => ({ expenses: a[0], startStatus: calculateBalance(a[1]), monthStatus: calculateBalance(a[2]), unconfirmedBefore: a[3] }))
        .then(a => {
            a.endStatus = arrays.toObject(["benefit", "cost", "income", "split", "value", "balance"].map(key =>
                [key, Money.from(a.startStatus[key]).plus(a.monthStatus[key]).toString()]));
            return a;
        });
}

module.exports = {
    getAll: basic.getAll,
    getByMonth: getByMonth,
    getById: basic.getById,
    getDivision: basic.getDivision,
    deleteById: basic.deleteById,
    queryReceivers: basic.queryReceivers,
    create: basic.create,
    update: basic.update,
    createRecurring: recurring.createRecurring
};
