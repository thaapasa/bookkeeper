import { ExpenseStatus, UserExpense } from 'shared/types/Expense';
import { YearMonth } from 'shared/types/Time';
import { MoneyLike } from 'shared/util/Money';
import { fetchMonthStatus } from 'shared/util/test/ExpenseHelper';
import { SessionWithControl } from 'shared/util/test/TestClient';

export async function checkMonthStatus(
  session: SessionWithControl,
  month: YearMonth,
  expectedBenefit?: MoneyLike,
  expectItems?: (items: UserExpense[]) => any
): Promise<ExpenseStatus> {
  const m = await fetchMonthStatus(session, month);
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
  return m.monthStatus;
}
