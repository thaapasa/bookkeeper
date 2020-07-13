import { Expense, ExpenseDivision } from 'shared/types/Expense';
import { Source } from 'shared/types/Session';

export function getBenefitorsForExpense(
  expense: Expense,
  division: ExpenseDivision,
  sourceMap: Record<string, Source>
): number[] {
  const benefit = getBenefitorsFromDivision(expense, division);
  if (benefit.length > 0) {
    return benefit;
  }
  const source = sourceMap[expense.sourceId];
  return source?.users.map(u => u.userId) ?? [];
}

export function getBenefitorsFromDivision(
  expense: Expense,
  division: ExpenseDivision
): number[] {
  switch (expense.type) {
    case 'transfer':
      return division.filter(d => d.type === 'transferee').map(d => d.userId);
    case 'expense':
      return division.filter(d => d.type === 'benefit').map(d => d.userId);
    case 'income':
      return division.filter(d => d.type === 'split').map(d => d.userId);
  }
  return [];
}
