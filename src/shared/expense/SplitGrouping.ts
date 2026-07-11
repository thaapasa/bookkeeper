import { UserExpense } from './Expense';

/**
 * Reorder a date-sorted expense list so that expenses sharing a split id are
 * adjacent within each day. The order is otherwise preserved: each split group
 * is anchored at its first member's position, and the trailing members are
 * pulled up right after it.
 */
export function groupSplitExpenses(expenses: UserExpense[]): UserExpense[] {
  const result: UserExpense[] = [];
  const used = new Set<number>();
  for (let i = 0; i < expenses.length; i++) {
    const e = expenses[i];
    if (used.has(e.id)) continue;
    result.push(e);
    used.add(e.id);
    if (!e.splitId) continue;
    for (let j = i + 1; j < expenses.length && expenses[j].date === e.date; j++) {
      const other = expenses[j];
      if (!used.has(other.id) && other.splitId === e.splitId) {
        result.push(other);
        used.add(other.id);
      }
    }
  }
  return result;
}
