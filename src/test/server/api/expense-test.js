"use strict";

const chai = require("chai");
const expect = chai.expect;
const client = require("../support/test-client");
const describe = require("mocha").describe;
const it = require("mocha").it;
const before = require("mocha").before;
const after = require("mocha").after;
const log = require("../../../shared/util/log");
const moment = require("moment");
const testUtil = require("../support/test-util");
const help = require("./expense-help");

describe("expense", function() {

    let session = null;

    const newExpense = help.newExpense;

    before(() => client.getSession("sale", "salasana").then(s => { session = s; return null; }));

    after(() => help.deleteCreated(session).then(session.logout));

    it("should insert new expense", () => newExpense(session)
        .then(help.checkCreateStatus)
        .then(id => session.get(`/api/expense/${id}`))
        .then(e => expect(e).to.contain({ title: "Karkkia ja porkkanaa", date: "2017-01-22", sum: "10.51",
                description: null, confirmed: true }))
    );

    it("should have custom values", () => newExpense(session,
        { title: "Crowbars", sum: "8.46", description: "On hyvä olla tarkka", confirmed: false })
        .then(s => session.get(`/api/expense/${s.expenseId}`))
        .then(e => expect(e).to.contain({ title: "Crowbars", date: "2017-01-22", sum: "8.46",
            description: "On hyvä olla tarkka", confirmed: false }))
    );

    it("should create division based on sourceId", () => newExpense(session, { sum: "8.46" })
        .then(s => session.get(`/api/expense/${s.expenseId}`))
        .then(e =>
            expect(e).to.contain({ sum: "8.46" }) &&
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

    it("should create income split", () => newExpense(session, { type: "income", sum: "200.00" })
        .then(s => session.get(`/api/expense/${s.expenseId}`))
        .then(e =>
            expect(e).to.contain({ sum: "200.00" }) &&
            expect(e).to.have.property("division")
                .that.is.an("array")
                .that.has.length(2)
                .that.contains({userId: 2, type: "income", sum: "200.00"})
                .that.contains({userId: 2, type: "split", sum: "-200.00"})
        ));

    it("should allow POST with GET data", () => newExpense(session,
        { sum: "8.46", division: [ { type: "cost", userId: 1, sum: "-5.00" }, { type: "cost", userId: 2, sum: "-3.46" } ] })
        .then(s => session.get(`/api/expense/${s.expenseId}`))
        .then(org => session.post(`/api/expense/${org.id}`, org)
            .then(s => expect(s.status).to.equal("OK") && expect(s.expenseId).to.equal(org.id))
            .then(s => session.get(`/api/expense/${org.id}`))
            .then(e => expect(e).to.deep.equal(org))));

    it("should not allow negated cost", () => testUtil.expectThrow(newExpense(session,
        { title: "Invalid cost", sum: "8.46", division: [ { type: "cost", userId: 1, sum: "5.00" },
            { type: "cost", userId: 2, sum: "3.46" } ] })));

    const monthStart = moment({ year: 2017, month: 0, day: 1 });
    const monthEnd = moment({ year: 2017, month: 1, day: 1 });
    it("should return expenses for correct month", () => session.get("/api/expense/month", { year: 2017, month: 1 })
        .then(s => s.expenses.forEach(e =>
            expect(moment(e.date).isBefore(monthEnd)).to.be.true &&
            expect(moment(e.date).isSameOrAfter(monthStart)).to.be.true
        )));

    it("should have new expense in month view", () => Promise.all([
        newExpense(session, { date: "2017-01-22", title: "Osuu" }),
        newExpense(session, { date: "2017-02-01", title: "Ei osu" }) ])
        .then(c => session.get("/api/expense/month", { year: 2017, month: 1 })
            .then(s =>
                expect(s.expenses.find(e => e.id === c[0].expenseId)).to.be.an("object").that.contains({ title: "Osuu" }) &&
                expect(s.expenses.find(e => e.id === c[1].expenseId)).to.be.undefined
        )));

});
