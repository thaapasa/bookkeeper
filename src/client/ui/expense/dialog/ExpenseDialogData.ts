import {
  evenBeneficiaryDivision,
  Expense,
  ExpenseDivision,
  ExpenseDivisionItem,
  expensePayer,
  ExpenseType,
  getBeneficiaryUserIds,
  negateDivision,
  splitByShares,
} from 'shared/expense';
import { Source } from 'shared/types';
import { Money, MoneyLike, sortAndCompareElements } from 'shared/util';
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
  const payer = calculateDivisionCounterpart(sum, source, beneficiary, payerType === 'income').map(
    (p): ExpenseDivisionItem => ({
      userId: p.userId,
      type: payerType,
      sum: Money.from(p.sum).toString(),
    }),
  );
  return beneficiary.concat(payer);
}

function calculateDivisionCounterpart(
  sum: MoneyLike,
  source: Source,
  otherDivision: ExpenseDivisionItem[],
  expectPositive: boolean,
): Array<{ userId: number; sum: MoneyLike }> {
  const sourceUsers = source.users;
  const sourceUserIds = sourceUsers.map(s => s.userId);
  const benefitUserIds = otherDivision.map(b => b.userId);
  if (sortAndCompareElements(sourceUserIds, benefitUserIds)) {
    logger.info('Division pair has same users creating counterpart based on other part');
    return negateDivision(otherDivision);
  } else {
    // Calculate counterpart manually
    logger.info('Calculating counterpart by source users');
    const positiveDivision = splitByShares(sum, sourceUsers, logger);
    return expectPositive ? positiveDivision : negateDivision(positiveDivision);
  }
}
