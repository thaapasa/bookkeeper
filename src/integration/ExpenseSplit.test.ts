import 'jest';

import { UserExpenseWithDetails } from 'shared/types/Expense';
import { ExpenseSplit } from 'shared/types/ExpenseSplit';
import {
  cleanup,
  fetchExpense,
  newExpense,
  splitExpense,
} from 'shared/util/test/ExpenseHelper';
import { getSession, SessionWithControl } from 'shared/util/test/TestClient';

describe('splitting expenses', () => {
  let session: SessionWithControl;
  let expense: UserExpenseWithDetails;

  beforeEach(async () => {
    session = await getSession('sale', 'salasana');
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
      splitExpense(session, expense.id, [{ foo: 'bar' }, { baz: 'kok' }] as any)
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
  });

  it('should not create splits without at least two split items', async () => {
    expect(expense).toMatchObject({ title: 'Ruokakauppa' });
    await expect(
      splitExpense(session, expense.id, [{ ...SPLIT_DATA }])
    ).rejects.toMatchObject({
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
      ])
    ).rejects.toMatchObject({
      code: 'INVALID_SPLIT',
      data: { cause: 'Split sums (95.00) do not match expense sum (100.00)' },
    });
  });

  it('should split expense into three parts', async () => {
    expect(expense).toMatchObject({ title: 'Ruokakauppa' });
    await expect(
      splitExpense(session, expense.id, [
        { ...SPLIT_DATA, sum: '15.00' },
        { ...SPLIT_DATA, sum: '85.00' },
      ])
    ).resolves.toMatchObject({ status: 'OK' });
  });
});

const SPLIT_DATA: ExpenseSplit = {
  sourceId: 1,
  categoryId: 1,
  sum: '10.00',
  division: [{ sum: '10.00', type: 'benefit', userId: 1 }],
  title: 'Osa',
};
