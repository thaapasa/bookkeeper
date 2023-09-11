import debug from 'debug';

import {
  Expense,
  ExpenseDivision,
  ExpenseDivisionType,
  ExpenseType,
  HasShares,
  HasSum,
  negateDivision,
  splitByShares,
} from 'shared/expense';
import { Source } from 'shared/types';
import { MoneyLike, sortAndCompareElements } from 'shared/util';

const log = debug('bookkeeper:expense-dialog');

export function getBenefitorsForExpense(
  expense: Expense,
  division: ExpenseDivision,
  sourceMap: Record<string, Source>,
): number[] {
  const benefit = getBenefitorsFromDivision(expense, division);
  if (benefit.length > 0) {
    return benefit;
  }
  const source = sourceMap[expense.sourceId];
  return source?.users.map(u => u.userId) ?? [];
}

export function getBenefitorsFromDivision(expense: Expense, division: ExpenseDivision): number[] {
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

export function calculateDivision(
  type: ExpenseType,
  sum: MoneyLike,
  benefit: number[],
  source: Source,
): ExpenseDivision {
  switch (type) {
    case 'expense': {
      const ben = splitByShares(
        sum,
        benefit.map(id => ({ userId: id, share: 1 })),
      );
      const cost = calculateDivisionCounterpart(sum, source, ben, false);
      return ben.map(itemTypeFixers.benefit).concat(cost.map(itemTypeFixers.cost));
    }
    case 'income': {
      const split = negateDivision(
        splitByShares(
          sum,
          benefit.map(id => ({ userId: id, share: 1 })),
        ),
      );
      const income = calculateDivisionCounterpart(sum, source, split, true);
      return income.map(itemTypeFixers.income).concat(split.map(itemTypeFixers.split));
    }
    case 'transfer': {
      const transferee = splitByShares(
        sum,
        benefit.map(id => ({ userId: id, share: 1 })),
      );
      const transferor = calculateDivisionCounterpart(sum, source, transferee, false);
      return transferee.map(itemTypeFixers.transferee).concat(transferor.map(itemTypeFixers.transferor));
    }
    default:
      throw new Error('Unknown expense type ' + type);
  }
}

function calculateDivisionCounterpart(
  sum: MoneyLike,
  source: Source,
  otherDivision: Array<HasShares & HasSum>,
  expectPositive: boolean,
) {
  const sourceUsers = source.users;
  const sourceUserIds = sourceUsers.map(s => s.userId);
  const benefitUserIds = otherDivision.map(b => b.userId);
  if (sortAndCompareElements(sourceUserIds, benefitUserIds)) {
    log('Division pair has same users creating counterpart based on other part');
    return negateDivision(otherDivision);
  } else {
    // Calculate counterpart manually
    log('Calculating counterpart by source users');
    const positiveDivision = splitByShares(sum, sourceUsers);
    return expectPositive ? positiveDivision : negateDivision(positiveDivision);
  }
}

type FixTypeFunc = <T extends HasSum>(item: T) => Omit<T, 'sum'> & { sum: string; type: ExpenseDivisionType };

function fixItemType(type: ExpenseDivisionType): FixTypeFunc {
  return <T extends HasSum>(item: T) => ({
    ...item,
    sum: item.sum.toString(),
    type,
  });
}

const itemTypeFixers: Record<ExpenseDivisionType, FixTypeFunc> = {
  cost: fixItemType('cost'),
  income: fixItemType('income'),
  benefit: fixItemType('benefit'),
  split: fixItemType('split'),
  transferor: fixItemType('transferor'),
  transferee: fixItemType('transferee'),
};
