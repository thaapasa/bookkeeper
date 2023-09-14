import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { expectArrayMatching } from 'test/expect/expectArrayMatching';

import { ExpenseSplit, UserExpenseWithDetails } from 'shared/expense';
import {
  cleanup,
  fetchExpense,
  fetchMonthStatus,
  newExpense,
  splitExpense,
} from 'shared/expense/test';
import { createTestClient, SessionWithControl } from 'shared/net/test';
import { YearMonth } from 'shared/time';
import { Money } from 'shared/util';
import { logger } from 'server/Logger';

import { checkMonthStatus } from './MonthStatus';

const month: YearMonth = { year: 2017, month: 1 };

describe('splitting expenses', () => {
  let session: SessionWithControl;
  let expense: UserExpenseWithDetails;

  const client = createTestClient({ logger });

  beforeEach(async () => {
    session = await client.getSession('sale', 'salasana');
    const m = await newExpense(session, {
      sum: '100.00',
      confirmed: false,
      date: '2017-01-15',
      title: 'Ruokakauppa',
    });
    expense = await fetchExpense(session, m.expenseId ?? 0);
  });
  afterEach(async () => {
    await cleanup(session);
  });

  it('should not allow invalid split data', async () => {
    expect(expense).toMatchObject({ title: 'Ruokakauppa' });
    await expect(
      splitExpense(session, expense.id, [{ foo: 'bar' }, { baz: 'kok' }] as any),
    ).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
    });
  });

  it('should not create splits without at least two split items', async () => {
    expect(expense).toMatchObject({ title: 'Ruokakauppa' });
    await expect(splitExpense(session, expense.id, [{ ...SPLIT_DATA }])).rejects.toMatchObject({
      code: 'INVALID_SPLIT',
      data: { cause: 'Expense splitting requires at least two splits' },
    });
  });

  it('should not allow splits with wrong item sum', async () => {
    expect(expense).toMatchObject({ title: 'Ruokakauppa' });
    await expect(
      splitExpense(session, expense.id, [
        { ...SPLIT_DATA, sum: '15.00' },
        { ...SPLIT_DATA, sum: '80.00' },
      ]),
    ).rejects.toMatchObject({
      code: 'INVALID_SPLIT',
      data: { cause: 'Split sums (95.00) do not match expense sum (100.00)' },
    });
  });

  it('T61 - should split expense into two parts', async () => {
    const m = await fetchMonthStatus(session, month);
    const status = checkMonthStatus(m);
    expect(expense).toMatchObject({
      title: 'Ruokakauppa',
      userBalance: '0.00',
      userBenefit: '50.00',
      userCost: '-50.00',
    });
    const userId = session.user.id;
    await expect(
      splitExpense(session, expense.id, [
        {
          ...SPLIT_DATA,
          sum: '15.00',
          title: 'Pilke1',
          division: [
            { type: 'benefit', sum: '15.00', userId },
            { type: 'cost', sum: '-15.00', userId },
          ],
        },
        {
          ...SPLIT_DATA,
          title: 'Pilke2',
          sum: '85.00',
          division: [
            { type: 'benefit', sum: '85.00', userId },
            { type: 'cost', sum: '-85.00', userId },
          ],
        },
      ]),
    ).resolves.toMatchObject({ status: 'OK' });
    expect(checkMonthStatus(await fetchMonthStatus(session, month))).toMatchObject({
      ...status,
      benefit: Money.from(status.benefit).plus(50).toString(),
      cost: Money.from(status.cost).minus(50).toString(),
    });
    // Original expense is no longer found
    await expect(fetchExpense(session, expense.id)).rejects.toMatchObject({
      status: 404,
    });
    const newStatus = await fetchMonthStatus(session, month);
    expectArrayMatching(newStatus.expenses, [
      { title: 'Pilke1', sum: '15.00' },
      { title: 'Pilke2', sum: '85.00' },
    ]);
  });
});

const SPLIT_DATA: ExpenseSplit = {
  sourceId: 1,
  categoryId: 1,
  sum: '10.00',
  division: [{ sum: '10.00', type: 'benefit', userId: 1 }],
  title: 'Osa',
};
