import {
  Expense,
  ExpenseDivision,
  ExpenseInEditor,
  ExpenseDivisionType,
} from 'shared/types/Expense';
import { Source } from 'shared/types/Session';
import Money, { MoneyLike } from 'shared/util/Money';
import {
  splitByShares,
  HasShares,
  HasSum,
  negateDivision,
} from 'shared/util/Splitter';
import { sortAndCompareElements } from 'shared/util/Arrays';
import debug from 'debug';

const log = debug('bookkeeper:expense-dialog');

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

export function calculateDivision(
  expense: ExpenseInEditor,
  sum: MoneyLike,
  sourceMap: Record<string, Source>
): ExpenseDivision {
  switch (expense.type) {
    case 'expense': {
      const benefit = splitByShares(
        sum,
        expense.benefit.map(id => ({ userId: id, share: 1 }))
      );
      const cost = calculateCost(sum, sourceMap[expense.sourceId], benefit);
      return benefit
        .map(itemTypeFixers.benefit)
        .concat(cost.map(itemTypeFixers.cost));
    }
    case 'income': {
      const income = [{ userId: expense.userId, sum: Money.from(sum) }];
      const split = negateDivision(
        splitByShares(
          sum,
          expense.benefit.map(id => ({ userId: id, share: 1 }))
        )
      );
      return income
        .map(itemTypeFixers.income)
        .concat(split.map(itemTypeFixers.split));
    }
    case 'transfer': {
      const transferee = splitByShares(
        sum,
        expense.benefit.map(id => ({ userId: id, share: 1 }))
      );
      const transferor = calculateCost(
        sum,
        sourceMap[expense.sourceId],
        transferee
      );
      return transferee
        .map(itemTypeFixers.transferee)
        .concat(transferor.map(itemTypeFixers.transferor));
    }
    default:
      throw new Error('Unknown expense type ' + expense.type);
  }
}

function calculateCost(
  sum: MoneyLike,
  source: Source,
  benefit: Array<HasShares & HasSum>
) {
  const sourceUsers = source.users;
  const sourceUserIds = sourceUsers.map(s => s.userId);
  const benefitUserIds = benefit.map(b => b.userId);
  if (sortAndCompareElements(sourceUserIds, benefitUserIds)) {
    // Create cost based on benefit calculation
    log(
      'Source has same users than who benefit; creating benefit based on cost'
    );
    return negateDivision(benefit);
  } else {
    // Calculate cost manually
    log('Calculating cost by source users');
    return negateDivision(splitByShares(sum, sourceUsers));
  }
}

type FixTypeFunc = <T extends HasSum>(
  item: T
) => Omit<T, 'sum'> & { sum: string; type: ExpenseDivisionType };

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
