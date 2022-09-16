import { ExpenseStatus, UserExpense } from 'shared/expense';
import { fetchMonthStatus } from 'shared/expense/test';
import { SessionWithControl } from 'shared/net/test';
import { YearMonth } from 'shared/time';
import { MoneyLike } from 'shared/util';

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
