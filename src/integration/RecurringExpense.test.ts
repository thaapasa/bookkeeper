import 'jest';

import { ApiMessage } from 'shared/types/Api';
import {
  Expense,
  ExpenseCollection,
  RecurringExpensePeriod,
} from 'shared/types/Expense';
import { YearMonth } from 'shared/types/Time';
import Money from 'shared/util/Money';
import {
  captureId,
  checkCreateStatus,
  cleanup,
  newExpense,
} from 'shared/util/test/ExpenseHelper';
import { getSession, SessionWithControl } from 'shared/util/test/TestClient';
import { ISODate, toISODate } from 'shared/util/Time';
import { uri } from 'shared/util/UrlUtils';
import { RecurringExpenseDb } from 'server/data/RecurringExpenseDb';

import { checkMonthStatus } from './MonthStatus';

const month: YearMonth = { year: 2017, month: 1 };

describe('recurring expenses', () => {
  let session: SessionWithControl;

  beforeEach(async () => {
    session = await getSession('sale', 'salasana');
  });
  afterEach(async () => {
    await cleanup(session);
  });

  it.each<[ISODate, RecurringExpensePeriod, ISODate]>([
    ['2017-01-01', 'monthly', '2017-02-01'],
    ['2017-01-31', 'monthly', '2017-02-28'],
    ['2017-12-31', 'monthly', '2018-01-31'],
    ['2017-12-01', 'monthly', '2018-01-01'],
    ['2004-02-29', 'yearly', '2005-02-28'],
    ['2004-02-28', 'yearly', '2005-02-28'],
    ['2004-03-01', 'yearly', '2005-03-01'],
  ])(
    'calculates next recurrence of %s (%s) to be %s',
    (start, period, expected) => {
      expect(toISODate(RecurringExpenseDb.nextRecurrence(start, period))).toBe(
        expected
      );
    }
  );

  it('templates should not show up on expense queries', async () => {
    const status1 = await checkMonthStatus(session, month);
    const expenseId = checkCreateStatus(
      await newExpense(session, {
        sum: '150.00',
        confirmed: false,
        date: '2017-01-15',
        title: 'Tonnikalaa',
      })
    );

    await expect(
      session.get<Expense>(uri`/api/expense/${expenseId}`)
    ).resolves.toMatchObject({
      division: expect.arrayContaining([
        { userId: 2, type: 'benefit', sum: '75.00' },
      ]),
      recurringExpenseId: null,
    });

    const monthBenefit2 = await checkMonthStatus(
      session,
      month,
      Money.from(status1.benefit).plus('75').toString(),
      ex => expect(ex.find(i => i.id === expenseId)).toBeTruthy
    );
    const s = await session.put<ApiMessage>(
      `/api/expense/recurring/${expenseId}`,
      { period: 'monthly' }
    );
    expect(s.recurringExpenseId).toBeGreaterThan(0);
    expect(s.templateExpenseId).toBeGreaterThan(0);
    captureId(s);
    checkMonthStatus(session, month, monthBenefit2.benefit);

    const e2 = await session.get<Expense>(`/api/expense/${expenseId}`);
    expect(e2.recurringExpenseId).toEqual(s.recurringExpenseId);
  });

  it('creates 1/month', async () => {
    const expenseId = checkCreateStatus(
      await newExpense(session, {
        sum: '150.00',
        confirmed: false,
        date: '2017-01-01',
        title: 'Pan-galactic gargleblaster',
      })
    );
    const s = await session.put<ApiMessage>(
      `/api/expense/recurring/${expenseId}`,
      { period: 'monthly' }
    );
    expect(s.recurringExpenseId).toBeGreaterThan(0);
    expect(s.templateExpenseId).toBeGreaterThan(0);
    captureId(s);

    await session.get<ExpenseCollection>('/api/expense/month', {
      year: 2017,
      month: 2,
    });
    const expenses = await session.get<ExpenseCollection>(
      '/api/expense/month',
      { year: 2017, month: 1 }
    );
    const matches = expenses.expenses.filter(
      e => e.recurringExpenseId === s.recurringExpenseId
    );
    expect(matches).toMatchObject([
      { title: 'Pan-galactic gargleblaster', date: '2017-01-01' },
    ]);
  });
});
