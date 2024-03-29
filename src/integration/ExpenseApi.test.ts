import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { expectArrayContaining } from 'test/expect/expectArrayContaining';

import { Expense, ExpenseCollection, ExpenseStatus } from 'shared/expense';
import { checkCreateStatus, cleanup, division, findUserId, newExpense } from 'shared/expense/test';
import { createTestClient, SessionWithControl } from 'shared/net/test';
import { ISODatePattern, toDayjs } from 'shared/time';
import { ApiMessage } from 'shared/types';
import { Money } from 'shared/util';
import { expectThrow } from 'shared/util/test';
import { logger } from 'server/Logger';

/* eslint-disable @typescript-eslint/no-non-null-assertion */

function checkValueAndBalance(status: ExpenseStatus, _i: any, _name: string) {
  expect(status.value).toEqual(
    Money.from(status.cost).plus(status.benefit).plus(status.income).plus(status.split).toString(),
  );
  expect(status.balance).toEqual(Money.from(status.value).negate().toString());
}

describe('expense', () => {
  let session: SessionWithControl;
  let u1id: number;
  let u2id: number;
  const client = createTestClient({ logger });

  beforeEach(async () => {
    session = await client.getSession('sale', 'salasana');
    u1id = findUserId('jenni', session);
    u2id = findUserId('sale', session);
  });

  afterEach(async () => {
    await cleanup(session);
  });

  it('should insert new expense', async () => {
    const res = await newExpense(session);
    const id = checkCreateStatus(res);
    const e = await session.get(`/api/expense/${id}`);
    expect(e).toMatchObject({
      title: 'Karkkia ja porkkanaa',
      date: '2018-01-22',
      sum: '10.51',
      description: null,
      confirmed: true,
    });
  });

  it('should have custom values', async () => {
    const res = await newExpense(session, {
      title: 'Crowbars',
      sum: '8.46',
      description: 'On hyvä olla tarkka',
      confirmed: false,
    });
    const e = await session.get(`/api/expense/${res.expenseId}`);
    expect(e).toMatchObject({
      title: 'Crowbars',
      date: '2018-01-22',
      sum: '8.46',
      description: 'On hyvä olla tarkka',
      confirmed: false,
    });
  });

  it('should create division based on sourceId', async () => {
    const res = await newExpense(session, { sum: '8.46' });
    const e = await session.get<Expense>(`/api/expense/${res.expenseId}`);
    expect(e).toMatchObject({ sum: '8.46' });
    expect(e).toHaveProperty('division');
    expectArrayContaining(e.division, [
      { userId: u1id, type: 'cost', sum: '-4.23' },
      { userId: u2id, type: 'cost', sum: '-4.23' },
      { userId: u1id, type: 'benefit', sum: '4.23' },
      { userId: u2id, type: 'benefit', sum: '4.23' },
    ]);
    expect(e.division.length).toEqual(4);
  });

  it('should create benefit based on given cost', async () => {
    const res = await newExpense(session, {
      sum: '8.46',
      division: [
        { type: 'cost', userId: u1id, sum: '-5.00' },
        { type: 'cost', userId: u2id, sum: '-3.46' },
      ],
    });
    const e = await session.get<Expense>(`/api/expense/${res.expenseId}`);
    expect(e).toHaveProperty('division');
    expectArrayContaining(e.division, [
      { userId: u1id, type: 'cost', sum: '-5.00' },
      { userId: u2id, type: 'cost', sum: '-3.46' },
      { userId: u1id, type: 'benefit', sum: '5.00' },
      { userId: u2id, type: 'benefit', sum: '3.46' },
    ]);
    expect(e.division.length).toEqual(4);
  });

  it('should create income split', async () => {
    const res = await newExpense(session, { type: 'income', sum: '200.00' });
    const e = await session.get<Expense>(`/api/expense/${res.expenseId}`);
    expect(e).toMatchObject({ sum: '200.00' });
    expect(e).toHaveProperty('division');
    expectArrayContaining(e.division, [
      { userId: u2id, type: 'income', sum: '200.00' },
      { userId: u2id, type: 'split', sum: '-200.00' },
    ]);
    expect(e.division.length).toEqual(2);
  });

  it('should allow PUT with GET data', async () => {
    const res = await newExpense(session, {
      sum: '8.46',
      division: [
        { type: 'cost', userId: 1, sum: '-5.00' },
        { type: 'cost', userId: 2, sum: '-3.46' },
      ],
    });
    const org = await session.get<Expense>(`/api/expense/${res.expenseId}`);
    const s = await session.put<ApiMessage>(`/api/expense/${org.id}`, org);
    expect(s.status).toEqual('OK');
    expect(s.expenseId).toEqual(org.id);
    const e = await session.get<Expense>(`/api/expense/${org.id}`);
    expect(e).toEqual(org);
  });

  it('should not allow negated cost', async () => {
    expectThrow(() =>
      newExpense(session, {
        title: 'Invalid cost',
        sum: '8.46',
        division: [
          { type: 'cost', userId: 1, sum: '5.00' },
          { type: 'cost', userId: 2, sum: '3.46' },
        ],
      }),
    );
  });

  it('should return expenses for correct month', async () => {
    const monthStart = toDayjs('2017-01-01', ISODatePattern);
    const nextMonth = toDayjs('2017-02-01', ISODatePattern);
    const s = await session.get<ExpenseCollection>('/api/expense/month', {
      year: 2017,
      month: 1,
    });
    s.expenses.forEach(e => {
      expect(toDayjs(e.date).isBefore(nextMonth)).toEqual(true);
      expect(toDayjs(e.date).isSameOrAfter(monthStart)).toEqual(true);
    });
  });

  it('should have new expense in month view', async () => {
    const [hit, noHit] = await Promise.all([
      newExpense(session, { date: '2017-01-22', title: 'Osuu' }),
      newExpense(session, { date: '2017-02-01', title: 'Ei osu' }),
    ]);
    const s = await session.get<ExpenseCollection>('/api/expense/month', {
      year: 2017,
      month: 1,
    });
    expect(s.expenses.find(e => e.id === hit.expenseId)).toMatchObject({
      title: 'Osuu',
    });
    expect(s.expenses.find(e => e.id === noHit.expenseId)).toBeUndefined();
  });

  it('should calculate start/month/end balances correctly', async () => {
    const [jan1, feb1] = await Promise.all([
      session.get<ExpenseCollection>('/api/expense/month', {
        year: 2017,
        month: 1,
      }),
      session.get<ExpenseCollection>('/api/expense/month', {
        year: 2017,
        month: 2,
      }),
    ]);
    expect(jan1).toHaveProperty('monthStatus');
    expect(jan1.monthStatus).toHaveProperty('cost');

    await Promise.all([
      newExpense(session, {
        date: '2017-01-22',
        sum: '500',
        division: division.iPayShared(session, '500'),
      }),
      newExpense(session, {
        date: '2017-02-01',
        sum: '740',
        division: division.iPayShared(session, '740'),
      }),
    ]);

    const [jan2, feb2] = await Promise.all([
      session.get<ExpenseCollection>('/api/expense/month', {
        year: 2017,
        month: 1,
      }),
      session.get<ExpenseCollection>('/api/expense/month', {
        year: 2017,
        month: 2,
      }),
    ]);

    expect(
      Money.equals(jan2.monthStatus.cost, Money.from(jan1.monthStatus.cost).plus('-500')),
    ).toBeTruthy();
    expect(
      Money.equals(feb2.monthStatus.cost, Money.from(feb1.monthStatus.cost).plus('-740')),
    ).toBeTruthy();
    expect(
      Money.equals(jan2.monthStatus.benefit, Money.from(jan1.monthStatus.benefit).plus('250')),
    ).toBeTruthy();
    expect(
      Money.equals(feb2.monthStatus.benefit, Money.from(feb1.monthStatus.benefit).plus('370')),
    ).toBeTruthy();

    [jan1, jan2, feb1, feb2].forEach((o, i) =>
      ['monthStatus', 'startStatus', 'endStatus'].forEach(status =>
        checkValueAndBalance((o as any)[status], i, status),
      ),
    );

    expect(feb1.startStatus).toEqual(jan1.endStatus);
    expect(feb2.startStatus).toEqual(jan2.endStatus);

    expect(
      Money.equals(jan2.endStatus.cost, Money.from(jan1.endStatus.cost).plus('-500')),
    ).toBeTruthy();
    expect(
      Money.equals(feb2.endStatus.cost, Money.from(feb1.endStatus.cost).plus('-500').plus('-740')),
    ).toBeTruthy();
    expect(
      Money.equals(jan2.endStatus.benefit, Money.from(jan1.endStatus.benefit).plus('250')),
    ).toBeTruthy();
    expect(
      Money.equals(
        feb2.endStatus.benefit,
        Money.from(feb1.endStatus.benefit).plus('370').plus('250'),
      ),
    ).toBeTruthy();

    expect(
      Money.equals(jan2.endStatus.balance, Money.from(jan1.endStatus.balance).plus('250')),
    ).toBeTruthy();
    expect(
      Money.equals(
        feb2.endStatus.balance,
        Money.from(feb1.endStatus.balance).plus('250').plus('370'),
      ),
    ).toBeTruthy();
    expect(
      Money.equals(jan2.endStatus.value, Money.from(jan1.endStatus.value).plus('-250')),
    ).toBeTruthy();
    expect(
      Money.equals(
        feb2.endStatus.value,
        Money.from(feb1.endStatus.value).plus('-250').plus('-370'),
      ),
    ).toBeTruthy();
  });
});
