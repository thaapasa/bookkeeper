import { ExpenseCollection, UserExpense } from 'shared/types/Expense';
import Money, { MoneyLike } from 'shared/util/Money';
import { SessionWithControl } from 'shared/util/test/TestClient';

export async function checkMonthStatus(
  session: SessionWithControl,
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
