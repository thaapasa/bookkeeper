import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { expectArrayContaining } from 'test/expect/expectArrayContaining';

import { Expense, ExpenseCollection, RecurrencePeriod } from 'shared/expense';
import {
  captureId,
  checkCreateStatus,
  cleanup,
  fetchMonthStatus,
  newExpense,
} from 'shared/expense/test';
import { uri } from 'shared/net';
import { createTestClient, SessionWithControl } from 'shared/net/test';
import { ISODate, toISODate, YearMonth } from 'shared/time';
import { ApiMessage } from 'shared/types';
import { Money } from 'shared/util';
import { calculateNextRecurrence } from 'server/data/RecurringExpenseService';
import { logger } from 'server/Logger';

import { checkMonthStatus } from './MonthStatus';

const month: YearMonth = { year: 2017, month: 1 };

describe('recurring expenses', () => {
  let session: SessionWithControl;
  const client = createTestClient({ logger });

  beforeEach(async () => {
    session = await client.getSession('sale', 'salasana');
  });
  afterEach(async () => {
    await cleanup(session);
  });

  it.each<[ISODate, RecurrencePeriod, ISODate]>([
    ['2017-01-01', { amount: 1, unit: 'months' }, '2017-02-01'],
    ['2017-01-31', { amount: 1, unit: 'months' }, '2017-02-28'],
    ['2017-12-31', { amount: 1, unit: 'months' }, '2018-01-31'],
    ['2017-12-01', { amount: 1, unit: 'months' }, '2018-01-01'],
    ['2004-02-29', { amount: 1, unit: 'years' }, '2005-02-28'],
    ['2004-02-28', { amount: 1, unit: 'years' }, '2005-02-28'],
    ['2004-03-01', { amount: 1, unit: 'years' }, '2005-03-01'],
    ['2004-03-01', { amount: 1, unit: 'weeks' }, '2004-03-08'],
    ['2004-03-02', { amount: 1, unit: 'weeks' }, '2004-03-09'],
    ['2004-03-02', { amount: 1, unit: 'quarters' }, '2004-06-02'],
  ])('T45 - calculates next recurrence of %s (%s) to be %s', (start, period, expected) => {
    expect(toISODate(calculateNextRecurrence(start, period))).toBe(expected);
  });

  it('T53 - templates should not show up on expense queries', async () => {
    const status1 = checkMonthStatus(await fetchMonthStatus(session, month));
    const expenseId = checkCreateStatus(
      await newExpense(session, {
        sum: '150.00',
        confirmed: false,
        date: '2017-01-15',
        title: 'Tonnikalaa',
      }),
    );

    const data = await session.get<Expense>(uri`/api/expense/${expenseId}`);
    expect(data.recurringExpenseId).toBeNull();
    expectArrayContaining(data.division, [{ userId: 2, type: 'benefit', sum: '75.00' }]);

    const monthBenefit2 = checkMonthStatus(
      await fetchMonthStatus(session, month),
      Money.from(status1.benefit).plus('75').toString(),
      ex => expect(ex.find(i => i.id === expenseId)).toBeTruthy,
    );
    const s = await session.post<ApiMessage>(`/api/expense/recurring/${expenseId}`, {
      period: { amount: 1, unit: 'months' },
    });
    expect(s.recurringExpenseId).toBeGreaterThan(0);
    expect(s.templateExpenseId).toBeGreaterThan(0);
    captureId(s);
    checkMonthStatus(await fetchMonthStatus(session, month), monthBenefit2.benefit);

    const e2 = await session.get<Expense>(`/api/expense/${expenseId}`);
    expect(e2.recurringExpenseId).toEqual(s.recurringExpenseId ?? null);
  });

  it('T92 - creates 1/month', async () => {
    const expenseId = checkCreateStatus(
      await newExpense(session, {
        sum: '150.00',
        confirmed: false,
        date: '2017-01-01',
        title: 'Pan-galactic gargleblaster',
      }),
    );
    const s = await session.post<ApiMessage>(`/api/expense/recurring/${expenseId}`, {
      period: { amount: 1, unit: 'months' },
    });
    expect(s.recurringExpenseId).toBeGreaterThan(0);
    expect(s.templateExpenseId).toBeGreaterThan(0);
    captureId(s);

    await session.get<ExpenseCollection>('/api/expense/month', {
      year: 2017,
      month: 2,
    });
    const expenses = await session.get<ExpenseCollection>('/api/expense/month', {
      year: 2017,
      month: 1,
    });
    const matches = expenses.expenses.filter(e => e.recurringExpenseId === s.recurringExpenseId);
    expect(matches).toMatchObject([{ title: 'Pan-galactic gargleblaster', date: '2017-01-01' }]);
  });
});
