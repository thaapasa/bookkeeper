import 'jest';

// There is some kind of a bug in moment inclusion with regards to running in browser/node and when running tests
// See https://github.com/aurelia/skeleton-navigation/issues/606
// For now, use this syntax in unit tests to make things work
import moment from 'moment';
import Money from '../shared/util/money';
import * as help from '../shared/util/test/expense-helper';
import * as client from '../shared/util/test/test-client';
import { SessionWithControl } from '../shared/util/test/test-client';
import { Expense, ExpenseCollection } from '../shared/types/expense';
import { findUserId } from '../shared/util/test/expense-helper';
import { ApiMessage } from '../shared/types/api';
import { expectThrow } from '../shared/util/test/test-util';

function checkValueAndBalance(status, i, name) {
    expect(status.value).toEqual(Money.from(status.cost).plus(status.benefit).plus(status.income).plus(status.split).toString());
    expect(status.balance).toEqual(Money.from(status.value).negate().toString());
}

describe('expense', function() {

    let session: SessionWithControl;
    let u1id: number;
    let u2id: number;
    const newExpense = help.newExpense;

    beforeEach(async () => {
        session = await client.getSession('sale', 'salasana');
        u1id = findUserId('jenni', session);
        u2id = findUserId('sale', session);
    });

    afterEach(async () => { await help.cleanup(session); });

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
            { userId: u1id, type: 'cost', sum: '-4.23' },
            { userId: u2id, type: 'cost', sum: '-4.23' },
            { userId: u1id, type: 'benefit', sum: '4.23' },
            { userId: u2id, type: 'benefit', sum: '4.23' },
        ]));
        expect(e.division!.length).toEqual(4);
    });

    it('should create benefit based on given cost', async () => {
        const res = await newExpense(session,
            { sum: '8.46', division: [ { type: 'cost', userId: u1id, sum: '-5.00' }, { type: 'cost', userId: u2id, sum: '-3.46' } ] });
        const e = await session.get<Expense>(`/api/expense/${res.expenseId}`);
        expect(e).toHaveProperty('division');
        expect(e.division).toEqual(expect.arrayContaining([
            { userId: u1id, type: 'cost', sum: '-5.00' },
            { userId: u2id, type: 'cost', sum: '-3.46' },
            { userId: u1id, type: 'benefit', sum: '5.00' },
            { userId: u2id, type: 'benefit', sum: '3.46' },
        ]));
        expect(e.division!.length).toEqual(4);
    });

    it('should create income split', async () => { 
        const res = await newExpense(session, { type: 'income', sum: '200.00' });
        const e = await session.get<Expense>(`/api/expense/${res.expenseId}`);
        expect(e).toMatchObject({ sum: '200.00' });
        expect(e).toHaveProperty('division');
        expect(e.division).toEqual(expect.arrayContaining([
            { userId: u2id, type: 'income', sum: '200.00' },
            { userId: u2id, type: 'split', sum: '-200.00' },
        ]));
        expect(e.division!.length).toEqual(2);
    });

    it('should allow POST with GET data', async () => {
        const res = await newExpense(session,
            { sum: '8.46', division: [ { type: 'cost', userId: 1, sum: '-5.00' }, { type: 'cost', userId: 2, sum: '-3.46' } ] });
        const org = await session.get<Expense>(`/api/expense/${res.expenseId}`);
        const s = await session.post<ApiMessage>(`/api/expense/${org.id}`, org);
        expect(s.status).toEqual('OK');
        expect(s.expenseId).toEqual(org.id);
        const e = await session.get<Expense>(`/api/expense/${org.id}`);
        expect(e).toEqual(org);
    });

    it('should not allow negated cost', async () => {
        expectThrow(() => newExpense(session, 
            { title: 'Invalid cost', sum: '8.46', division: [
                { type: 'cost', userId: 1, sum: '5.00' },
                { type: 'cost', userId: 2, sum: '3.46' },
            ] }));
    });

    it('should return expenses for correct month', async () => {
        const monthStart = moment({ year: 2017, month: 0, day: 1});
        const monthEnd = moment({ year: 2017, month: 1, day: 1});
        const s = await session.get<ExpenseCollection>('/api/expense/month', { year: 2017, month: 1 });
        s.expenses.forEach(e =>
            expect(moment(e.date).isBefore(monthEnd)).toEqual(true) &&
            expect(moment(e.date).isSameOrAfter(monthStart)).toEqual(true)
        );
    });

    it('should have new expense in month view', async () => {
        const [hit, noHit] = await Promise.all([
            newExpense(session, { date: '2017-01-22', title: 'Osuu' }),
            newExpense(session, { date: '2017-02-01', title: 'Ei osu' }),
        ]);
        const s = await session.get<ExpenseCollection>('/api/expense/month', { year: 2017, month: 1 });
        expect(s.expenses.find(e => e.id === hit.expenseId)).toMatchObject({ title: 'Osuu' });
        expect(s.expenses.find(e => e.id === noHit.expenseId)).toEqual(undefined);
    });

    it('should calculate start/month/end balances correctly', async () => {
        const [jan1, feb1] = await Promise.all([
            session.get<ExpenseCollection>('/api/expense/month', { year: 2017, month: 1 }),
            session.get<ExpenseCollection>('/api/expense/month', { year: 2017, month: 2 })
        ]);
        expect(jan1).toHaveProperty('monthStatus');
        expect(jan1.monthStatus).toHaveProperty('cost');

        await Promise.all([
            newExpense(session, { date: '2017-01-22', sum: '500', division: help.division.iPayShared(session, '500') }),
            newExpense(session, { date: '2017-02-01', sum: '740', division: help.division.iPayShared(session, '740') }),
        ]);

        const [jan2, feb2] = await Promise.all([
            session.get<ExpenseCollection>('/api/expense/month', { year: 2017, month: 1 }),
            session.get<ExpenseCollection>('/api/expense/month', { year: 2017, month: 2 })
        ]);

        expect(Money.equals(jan2.monthStatus.cost, Money.from(jan1.monthStatus.cost).plus('-500'))).toBeTruthy;
        expect(Money.equals(feb2.monthStatus.cost, Money.from(feb1.monthStatus.cost).plus('-740'))).toBeTruthy;
        expect(Money.equals(jan2.monthStatus.benefit, Money.from(jan1.monthStatus.benefit).plus('250'))).toBeTruthy;
        expect(Money.equals(feb2.monthStatus.benefit, Money.from(feb1.monthStatus.benefit).plus('370'))).toBeTruthy;

        [jan1, jan2, feb1, feb2].forEach((o, i) => ['monthStatus', 'startStatus', 'endStatus']
            .forEach(status => checkValueAndBalance(o[status], i, status)));

        expect(feb1.startStatus).toEqual(jan1.endStatus);
        expect(feb2.startStatus).toEqual(jan2.endStatus);

        expect(Money.equals(jan2.endStatus.cost, Money.from(jan1.endStatus.cost).plus('-500'))).toBeTruthy;
        expect(Money.equals(feb2.endStatus.cost, Money.from(feb1.endStatus.cost).plus('-500').plus('-740'))).toBeTruthy;
        expect(Money.equals(jan2.endStatus.benefit, Money.from(jan1.endStatus.benefit).plus('250'))).toBeTruthy;
        expect(Money.equals(feb2.endStatus.benefit, Money.from(feb1.endStatus.benefit).plus('370').plus('250'))).toBeTruthy;

        expect(Money.equals(jan2.endStatus.balance, Money.from(jan1.endStatus.balance).plus('250'))).toBeTruthy;
        expect(Money.equals(feb2.endStatus.balance, Money.from(feb1.endStatus.balance).plus('250').plus('370'))).toBeTruthy;
        expect(Money.equals(jan2.endStatus.value, Money.from(jan1.endStatus.value).plus('-250'))).toBeTruthy;
        expect(Money.equals(feb2.endStatus.value, Money.from(feb1.endStatus.value).plus('-250').plus('-370'))).toBeTruthy;
    });

});
