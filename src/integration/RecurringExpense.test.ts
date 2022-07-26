import 'jest';

import { ApiMessage } from 'shared/types/Api';
import { Expense, ExpenseCollection, UserExpense } from 'shared/types/Expense';
import Money, { MoneyLike } from 'shared/util/Money';
import {
  captureId,
  checkCreateStatus,
  cleanup,
  newExpense,
} from 'shared/util/test/ExpenseHelper';
import { getSession, SessionWithControl } from 'shared/util/test/TestClient';
import { toISODate } from 'shared/util/Time';
import { nextRecurrence } from 'server/data/RecurringExpenses';

describe('recurring expenses', () => {
  let session: SessionWithControl;

  beforeEach(async () => {
    session = await getSession('sale', 'salasana');
  });
  afterEach(async () => {
    await cleanup(session);
  });

  async function checkMonthStatus(
    expectedBenefit?: MoneyLike,
    expectItems?: (items: UserExpense[]) => any
  ): Promise<Money> {
    const m = await session.get<ExpenseCollection>(`/api/expense/month`, {
      year: 2017,
      month: 1,
    });
    expect(m).toHaveProperty('monthStatus');
    expect(m.monthStatus).toHaveProperty('benefit');
    if (expectedBenefit) {
      expect(m.monthStatus.benefit).toEqual(expectedBenefit);
    }
    expect(m).toHaveProperty('expenses');
    expect(m.expenses).toBeInstanceOf(Array);
    if (expectItems) {
      expectItems(m.expenses);
    }
    return Money.from(m.monthStatus.benefit);
  }

  it('calculates next recurrence correctly', async () => {
    expect(toISODate(nextRecurrence('2017-01-01', 'monthly'))).toBe(
      '2017-02-01'
    );
    expect(toISODate(nextRecurrence('2017-01-31', 'monthly'))).toBe(
      '2017-02-28'
    );
    expect(toISODate(nextRecurrence('2017-12-31', 'monthly'))).toBe(
      '2018-01-31'
    );
    expect(toISODate(nextRecurrence('2017-12-01', 'monthly'))).toBe(
      '2018-01-01'
    );
    expect(toISODate(nextRecurrence('2004-02-29', 'yearly'))).toBe(
      '2005-02-28'
    );
    expect(toISODate(nextRecurrence('2004-02-28', 'yearly'))).toBe(
      '2005-02-28'
    );
    expect(toISODate(nextRecurrence('2004-03-01', 'yearly'))).toBe(
      '2005-03-01'
    );
  });

  it('templates should not show up on expense queries', async () => {
    const monthBenefit1 = await checkMonthStatus();
    const expenseId = checkCreateStatus(
      await newExpense(session, {
        sum: '150.00',
        confirmed: false,
        date: '2017-01-15',
        title: 'Tonnikalaa',
      })
    );

    const e = await session.get<Expense>(`/api/expense/${expenseId}`);
    expect(e).toHaveProperty('division');
    expect(e.division).toContainEqual({
      userId: 2,
      type: 'benefit',
      sum: '75.00',
    });
    expect(e).toHaveProperty('recurringExpenseId');
    expect(e.recurringExpenseId).toBeNull();

    const monthBenefit2 = await checkMonthStatus(
      monthBenefit1.plus('75').toString(),
      ex => expect(ex.find(i => i.id === expenseId)).toBeTruthy
    );
    const s = await session.put<ApiMessage>(
      `/api/expense/recurring/${expenseId}`,
      { period: 'monthly' }
    );
    expect(s.recurringExpenseId).toBeGreaterThan(0);
    expect(s.templateExpenseId).toBeGreaterThan(0);
    captureId(s);
    checkMonthStatus(monthBenefit2.toString());

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
