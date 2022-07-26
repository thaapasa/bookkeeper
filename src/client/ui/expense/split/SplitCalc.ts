import { isDefined } from 'shared/types/Common';
import { ExpenseSplit } from 'shared/types/ExpenseSplit';
import Money, { MoneyLike } from 'shared/util/Money';

import { ExpenseSplitInEditor } from './ExpenseSplit.hooks';

/**
 * Calculates the cost of the first split so that the split rows add up
 * to the original expense sum.
 *
 * @param splits the split rows (first one is the automatically updating row)
 * @param sum the sum of the original expense
 */
export function calculateSplits(
  splits: ExpenseSplitInEditor[],
  sum: MoneyLike
): ExpenseSplitInEditor[] {
  if (splits.length === 0) {
    return [];
  }
  if (splits.length === 1) {
    return [{ ...splits[0], sum }];
  }

  const [first, ...fixed] = splits;

  const left = fixed.reduce(
    (acc, split) => acc.minus(split?.sum ?? '0'),
    Money.from(sum)
  );

  return [{ ...first, sum: left.toString() }, ...fixed];
}

export function isSplitComplete(
  split: ExpenseSplitInEditor
): split is ExpenseSplit {
  return (
    Money.from(split.sum).gt(0) &&
    split.title !== '' &&
    split.benefit.length > 0 &&
    isDefined(split.categoryId) &&
    isDefined(split.sourceId)
  );
}
