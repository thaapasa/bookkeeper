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
const Money = require("../../../shared/util/money");
const help = require("./expense-help");

describe("recurringExpense", function() {

    let session = null;

    const newExpense = help.newExpense;

    before(() => client.getSession("sale", "salasana").then(s => { session = s; return null; }));

    after(() => help.deleteCreated(session).then(session.logout));

    function checkMonthStatus(expectedBenefit, expectItems) {
        return session.get(`/api/expense/month`, { year: 2017, month: 1 })
            .then(m => {
                const e = expect(m).to.have.property("monthStatus").that.has.property("benefit");
                if (expectedBenefit) e.that.equals(expectedBenefit);
                expect(m).to.have.property("expenses").that.is.an("array");
                if (expectItems) expectItems(m.expenses);
                return Money.from(m.monthStatus.benefit);
            })
    }

    it("recurring expense template should not show up on expense queries", () => {
        let monthBenefit1 = null;
        let monthBenefit2 = null;
        let recurrenceId = null;
        let expenseId = null;
        return checkMonthStatus(false)
            .then(b => monthBenefit1 = b)
            .then(x => newExpense(session, { sum: "150.00", confirmed: false, date: "2017-01-15" }))
            .then(help.checkCreateStatus)
            .then(i => expenseId = i)
            .then(x => session.get(`/api/expense/${expenseId}`))
            .then(e => expect(e).to.have.property("division").that.contains({ userId: 2, type: "benefit", sum: "75.00" }) &&
                expect(e).to.have.property("recurringExpenseId").that.is.null)
            .then(x => checkMonthStatus(monthBenefit1.plus("75").toString(),
                e => expect(e.find(i => i.id === expenseId)).to.be.ok))
            .then(b => monthBenefit2 = b)
            .then(m => session.put(`/api/expense/recurring/${expenseId}`, { period: "monthly" }))
            .then(s => {
                expect(s).to.have.property("recurringExpenseId").that.is.above(0);
                expect(s).to.have.property("templateExpenseId").that.is.above(0);
                help.captureId(s.templateExpenseId);
                recurrenceId = s.recurringExpenseId;
            })
            .then(x => checkMonthStatus(monthBenefit2.toString()))
            .then(x => session.get(`/api/expense/${expenseId}`))
            .then(e => expect(e).to.have.property("recurringExpenseId").that.equals(recurrenceId))
    });


});
