"use strict";

const chai = require("chai");
const expect = chai.expect;
const client = require("../support/test-client");
const describe = require("mocha").describe;
const it = require("mocha").it;
const before = require("mocha").before;
const after = require("mocha").after;
const log = require("../../../shared/util/log");

function newExpense(session, expense) {
    const data = Object.assign({
        userId: session.user.id,
        date: "2017-01-22",
        receiver: "S-market",
        sum: "10.51",
        description: "Karkkia ja porkkanaa",
        sourceId: 1,
        categoryId: 2
    }, expense);
    return session.put("/api/expense", data);
}

describe("expense", function() {

    let session = null;

    before(() => client.getSession("sale", "salasana").then(s => { session = s; return null; }));

    after(() => session && session.logout());

    it("should insert new expense", () => newExpense(session)
        .then(s => expect(s.status).to.equal("OK") && expect(s.expenseId).to.be.above(0)));

    it("should create division based on sourceId", () => newExpense(session,
        { description: "Crowbars", sum: "8.46" })
        .then(s => session.get(`/api/expense/${s.expenseId}`))
        .then(e =>
            expect(e).to.contain.all.keys({ description: "Crowbars", date: "2017-01-22", sum: "10.51" }) &&
            expect(e).to.have.property("division")
                .that.is.an("array")
                .that.has.length(4)
                .that.contains({userId: 1, type: "cost", sum: "-4.23"})
                .that.contains({userId: 2, type: "cost", sum: "-4.23"})
                .that.contains({userId: 1, type: "benefit", sum: "4.23"})
                .that.contains({userId: 2, type: "benefit", sum: "4.23"})
        ));

    it("should create benefit based on given cost", () => newExpense(session,
        { sum: "8.46", division: [ { type: "cost", userId: 1, sum: "-5.00" }, { type: "cost", userId: 2, sum: "-3.46" } ] })
        .then(s => session.get(`/api/expense/${s.expenseId}`))
        .then(e => expect(e).to.have.property("division")
                .that.is.an("array")
                .that.has.length(4)
                .that.contains({userId: 1, type: "cost", sum: "-5.00"})
                .that.contains({userId: 2, type: "cost", sum: "-3.46"})
                .that.contains({userId: 1, type: "benefit", sum: "5.00"})
                .that.contains({userId: 2, type: "benefit", sum: "3.46"})
        ));


    it("should allow POST with GET data", () => newExpense(session,
        { sum: "8.46", division: [ { type: "cost", userId: 1, sum: "-5.00" }, { type: "cost", userId: 2, sum: "-3.46" } ] })
        .then(s => session.get(`/api/expense/${s.expenseId}`))
        .then(org => session.post(`/api/expense/${org.id}`, org)
            .then(s => expect(s.status).to.equal("OK") && expect(s.expenseId).to.equal(org.id))
            .then(s => session.get(`/api/expense/${org.id}`))
            .then(e => expect(e).to.deep.equal(org))));

    it("should not allow negated cost", () => log.suppressFor(() => newExpense(session,
        { description: "Invalid cost", sum: "8.46", division: [ { type: "cost", userId: 1, sum: "5.00" }, { type: "cost", userId: 2, sum: "3.46" } ] })
        .then(s => expect.fail("newExpense should throw error"))
        .catch(e => expect(e.status).to.equal(400))
    ));

});
