import { describe, expect, it } from 'bun:test';

import { UserExpense } from './Expense';
import { groupSplitExpenses } from './SplitGrouping';

const exp = (id: number, date: string, splitId: string | null): UserExpense =>
  ({ id, date, splitId }) as UserExpense;

describe('groupSplitExpenses', () => {
  it('pulls same-day split group members adjacent to the first member', () => {
    const order = groupSplitExpenses([
      exp(1, '2026-07-01', 'a'),
      exp(2, '2026-07-01', null),
      exp(3, '2026-07-01', 'a'),
      exp(4, '2026-07-01', 'b'),
      exp(5, '2026-07-01', 'a'),
      exp(6, '2026-07-01', 'b'),
    ]).map(e => e.id);
    expect(order).toEqual([1, 3, 5, 2, 4, 6]);
  });

  it('does not group across days', () => {
    const order = groupSplitExpenses([
      exp(1, '2026-07-01', 'a'),
      exp(2, '2026-07-01', null),
      exp(3, '2026-07-02', 'a'),
    ]).map(e => e.id);
    expect(order).toEqual([1, 2, 3]);
  });

  it('keeps a list without split ids unchanged', () => {
    const list = [exp(1, '2026-07-01', null), exp(2, '2026-07-01', null)];
    expect(groupSplitExpenses(list)).toEqual(list);
  });
});
