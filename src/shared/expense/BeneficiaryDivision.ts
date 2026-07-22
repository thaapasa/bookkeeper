import { Logger } from 'pino';

import { MoneyLike } from '../util/Money';
import { expenseBeneficiary, ExpenseDivisionItem, ExpenseType } from './Expense';
import { negateDivision, splitByShares } from './Splitter';

/**
 * The distinct user ids on the beneficiary side of a division (`benefit` for
 * expenses, `split` for incomes, `transferee` for transfers).
 */
export function getBeneficiaryUserIds(
  type: ExpenseType,
  division: ExpenseDivisionItem[],
): number[] {
  const beneficiaryType = expenseBeneficiary[type];
  return [...new Set(division.filter(d => d.type === beneficiaryType).map(d => d.userId))];
}

/**
 * Even split of the sum among the given users, as the division items of the
 * type's beneficiary side. The income beneficiary side (`split`) sums to
 * −sum; the others sum to +sum. Remainder cents are distributed
 * deterministically by `splitByShares`.
 */
export function evenBeneficiaryDivision(
  type: ExpenseType,
  sum: MoneyLike,
  userIds: number[],
  logger?: Logger,
): ExpenseDivisionItem[] {
  const beneficiaryType = expenseBeneficiary[type];
  const parts = splitByShares(
    sum,
    userIds.map(userId => ({ userId, share: 1 })),
    logger,
  );
  const signed = beneficiaryType === 'split' ? negateDivision(parts) : parts;
  return signed.map(p => ({ userId: p.userId, type: beneficiaryType, sum: p.sum.toString() }));
}
