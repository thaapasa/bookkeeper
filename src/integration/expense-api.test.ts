import 'jest';
import Money from '../shared/util/money';
import * as help from '../shared/util/test/expense-helper';
import fetch from 'node-fetch';
import * as client from '../shared/util/test/test-client';
import { SessionWithControl } from '../shared/util/test/test-client';
import { Expense } from '../shared/types/expense';
import { findCategoryId, findSourceId } from '../shared/util/test/expense-helper';
import search from 'material-ui/svg-icons/action/search';

function checkValueAndBalance(status, i, name) {
    expect(status.value).toEqual(Money.from(status.cost).plus(status.benefit).plus(status.income).plus(status.split).toString());
    expect(status.balance).toEqual(Money.from(status.value).negate().toString());
}

describe('expense', function() {

    let session: SessionWithControl;
    const newExpense = help.newExpense;

    beforeEach(async () => {
        session = await client.getSession('sale', 'salasana');
    });

    afterEach(async () => {
        if (session) {
            await help.deleteCreated(session);
            await session.logout();
        }
    });

    it('should insert new expense', async () => {
        const res = await newExpense(session);
        const id = help.checkCreateStatus(res);
        const e = await session.get(`/api/expense/${id}`);
        expect(e).toMatchObject({ title: 'Karkkia ja porkkanaa', date: '2018-01-22', sum: '10.51',
            description: null, confirmed: true });
    });

    it('should have custom values', async () => {
        const res = await newExpense(session, { title: 'Crowbars', sum: '8.46', description: 'On hyvä olla tarkka', confirmed: false });
        const e = await session.get(`/api/expense/${res.expenseId}`);
        expect(e).toMatchObject({ title: 'Crowbars', date: '2018-01-22', sum: '8.46',
            description: 'On hyvä olla tarkka', confirmed: false });
    });

    it('should create division based on sourceId', async () => {
        const res = await newExpense(session, { sum: '8.46' })
        const e = await session.get<Expense>(`/api/expense/${res.expenseId}`);
        expect(e).toMatchObject({ sum: '8.46' });
        expect(e).toHaveProperty('division');
        expect(e.division).toEqual(expect.arrayContaining([
            { userId: 1, type: 'cost', sum: '-4.23' },
            { userId: 2, type: 'cost', sum: '-4.23' },
            { userId: 1, type: 'benefit', sum: '4.23' },
            { userId: 2, type: 'benefit', sum: '4.23' },
        ]));
        expect(e.division!.length).toEqual(4);
    });
/*
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

    it("should calculate start/month/end balances correctly", () => {
        let jan1 = null;
        let feb1 = null;
        let jan2 = null;
        let feb2 = null;
        return Promise.all([
            session.get("/api/expense/month", { year: 2017, month: 1 }),
            session.get("/api/expense/month", { year: 2017, month: 2 })
        ])
            .then(a => { jan1 = a[0]; feb1 = a[1]; })
            .then(x => expect(jan1).to.have.property("monthStatus").that.has.property("cost"))
            .then(() => Promise.all([
                newExpense(session, { date: "2017-01-22", sum: "500", division: help.division.iPayShared(session, "500") }),
                newExpense(session, { date: "2017-02-01", sum: "740", division: help.division.iPayShared(session, "740") }) ]))
            .then(() => Promise.all([
                session.get("/api/expense/month", { year: 2017, month: 1 }),
                session.get("/api/expense/month", { year: 2017, month: 2 })
            ]))
            .then(a => { jan2 = a[0]; feb2 = a[1]; })
            .then(() => {
                expect(jan2.monthStatus.cost).to.equal(Money.from(jan1.monthStatus.cost).plus("-500").toString());
                expect(feb2.monthStatus.cost).to.equal(Money.from(feb1.monthStatus.cost).plus("-740").toString());
                expect(jan2.monthStatus.benefit).to.equal(Money.from(jan1.monthStatus.benefit).plus("250").toString());
                expect(feb2.monthStatus.benefit).to.equal(Money.from(feb1.monthStatus.benefit).plus("370").toString());

                [jan1, jan2, feb1, feb2].forEach((o, i) => ["monthStatus", "startStatus", "endStatus"]
                    .forEach(status => checkValueAndBalance(o[status], i, status)));

                expect(feb1.startStatus).to.deep.equal(jan1.endStatus);
                expect(feb2.startStatus).to.deep.equal(jan2.endStatus);

                expect(jan2.endStatus.cost).to.equal(Money.from(jan1.endStatus.cost).plus("-500").toString());
                expect(feb2.endStatus.cost).to.equal(Money.from(feb1.endStatus.cost).plus("-500").plus("-740").toString());
                expect(jan2.endStatus.benefit).to.equal(Money.from(jan1.endStatus.benefit).plus("250").toString());
                expect(feb2.endStatus.benefit).to.equal(Money.from(feb1.endStatus.benefit).plus("370").plus("250").toString());

                expect(jan2.endStatus.balance).to.equal(Money.from(jan1.endStatus.balance).plus("250").toString());
                expect(feb2.endStatus.balance).to.equal(Money.from(feb1.endStatus.balance).plus("250").plus("370").toString());
                expect(jan2.endStatus.value).to.equal(Money.from(jan1.endStatus.value).plus("-250").toString());
                expect(feb2.endStatus.value).to.equal(Money.from(feb1.endStatus.value).plus("-250").plus("-370").toString());
            });
    });
*/
});
