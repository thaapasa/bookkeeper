import { Expense, UserExpense } from 'shared/types/Expense';

export function toBaseExpense(expense: UserExpense): Expense {
  const {
    userValue,
    userBenefit,
    userBalance,
    userCost,
    userIncome,
    userSplit,
    userTransferee,
    userTransferor,
    ...rest
  } = expense;
  return rest;
}
