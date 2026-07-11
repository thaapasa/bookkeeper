import { UserExpense } from './Expense';

/**
 * Compute a map of expense ID → true for expenses that share their split group
 * with at least one other expense on the same day.
 */
export function computeSplitGroups(expenses: UserExpense[]): Record<number, boolean> {
  const groups: Record<string, number[]> = {};
  for (const e of expenses) {
    if (!e.splitId) continue;
    (groups[`${e.date}:${e.splitId}`] ??= []).push(e.id);
  }
  const result: Record<number, boolean> = {};
  for (const ids of Object.values(groups)) {
    if (ids.length < 2) continue;
    for (const id of ids) {
      result[id] = true;
    }
  }
  return result;
}

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
