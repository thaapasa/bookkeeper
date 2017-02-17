"use strict";

const chai = require("chai");
const expect = chai.expect;

module.exports = {};

const createdIds = [];

function captureId(e) {
    createdIds.push(e.expenseId || e.id || e);
    return e;
};
module.exports.captureId = captureId;

module.exports.newExpense = function newExpense(session, expense) {
    const data = Object.assign({
        userId: session.user.id,
        date: "2017-01-22",
        receiver: "S-market",
        type: "expense",
        sum: "10.51",
        title: "Karkkia ja porkkanaa",
        sourceId: 1,
        categoryId: 2
    }, expense);
    return session.put("/api/expense", data).then(captureId);
};

module.exports.deleteCreated = function deleteCreated(session) {
    return session ?
        Promise.all(createdIds.map(id => session.del(`/api/expense/${id}`))).then(() => {
            // Clear createdIds array
            createdIds.splice(0, createdIds.length);
            return true;
        }) :
        Promise.resolve(false);
};

module.exports.checkCreateStatus = function(s) {
    expect(s.status).to.equal("OK");
    expect(s.expenseId).to.be.above(0);
    return s.expenseId;
};
