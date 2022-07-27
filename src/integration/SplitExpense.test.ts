import 'jest';

import { UserExpenseWithDetails } from 'shared/types/Expense';
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
});
