import {
  divisionCounterpart,
  evenBeneficiaryDivision,
  Expense,
  ExpenseDivision,
  ExpenseDivisionItem,
  expensePayer,
  ExpenseType,
  getBeneficiaryUserIds,
} from 'shared/expense';
import { Source } from 'shared/types';
import { Money, MoneyLike } from 'shared/util';
import { logger } from 'client/Logger';

export function getBenefitorsForExpense(
  expense: Expense,
  division: ExpenseDivision,
  sourceMap: Record<string, Source>,
): number[] {
  const benefit = getBeneficiaryUserIds(expense.type, division);
  if (benefit.length > 0) {
    return benefit;
  }
  const source = sourceMap[expense.sourceId];
  return source?.users.map(u => u.userId) ?? [];
}

export function calculateDivision(
  type: ExpenseType,
  sum: MoneyLike,
  benefit: number[],
  source: Source,
): ExpenseDivision {
  const beneficiary = evenBeneficiaryDivision(type, sum, benefit, logger);
  const payerType = expensePayer[type];
  // Income earners are the positive side of the pair; every other payer side
  // (cost, transferor) is negative
  const payer = divisionCounterpart(sum, source, beneficiary, payerType === 'income', logger).map(
    (p): ExpenseDivisionItem => ({
      userId: p.userId,
      type: payerType,
      sum: Money.from(p.sum).toString(),
    }),
  );
  return beneficiary.concat(payer);
}
