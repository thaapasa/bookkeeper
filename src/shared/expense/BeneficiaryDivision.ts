import { Logger } from 'pino';

import { Source } from '../types/Source';
import { sortAndCompareElements } from '../util/Arrays';
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
/**
 * The payer-side counterpart of a beneficiary division. When the beneficiary
 * users are exactly the source's users, the counterpart mirrors the
 * beneficiary sums (negated), so a hand-tuned split stays symmetric; otherwise
 * it is split by the source's shares. `expectPositive` selects the sign of the
 * result: the income earner side is positive, cost/transferor are negative.
 */
export function divisionCounterpart(
  sum: MoneyLike,
  source: Source,
  otherDivision: ExpenseDivisionItem[],
  expectPositive: boolean,
  logger?: Logger,
): Array<{ userId: number; sum: MoneyLike }> {
  const sourceUserIds = source.users.map(s => s.userId);
  const benefitUserIds = otherDivision.map(b => b.userId);
  if (sortAndCompareElements(sourceUserIds, benefitUserIds)) {
    logger?.debug('Division pair has same users, creating counterpart based on other part');
    return negateDivision(otherDivision);
  }
  logger?.debug('Calculating counterpart by source users');
  const positiveDivision = splitByShares(sum, source.users, logger);
  return expectPositive ? positiveDivision : negateDivision(positiveDivision);
}

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
