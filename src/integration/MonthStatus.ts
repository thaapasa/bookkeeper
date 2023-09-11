import { expect } from "bun:test";

import { ExpenseCollection, ExpenseStatus, UserExpense } from 'shared/expense';
import { MoneyLike } from 'shared/util';

export function checkMonthStatus(
  m: ExpenseCollection,
  expectedBenefit?: MoneyLike,
  expectItems?: (items: UserExpense[]) => any
): ExpenseStatus {
  //const m = await fetchMonthStatus(session, month);
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
