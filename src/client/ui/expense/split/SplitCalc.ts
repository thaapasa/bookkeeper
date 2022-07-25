import { ExpenseSplit } from 'shared/types/ExpenseSplit';
import Money, { MoneyLike } from 'shared/util/Money';

/**
 * Calculates the cost of the first split so that the split rows add up
 * to the original expense sum.
 *
 * @param splits the split rows (first one is the automatically updating row)
 * @param sum the sum of the original expense
 */
export function calculateSplits(
  splits: (ExpenseSplit | null)[],
  sum: MoneyLike
): (ExpenseSplit | null)[] {
  if (splits.length === 0) {
    return [];
  }
  if (splits.length === 1) {
    return [splits[0] ? { ...splits[0], sum } : null];
  }

  const [first, ...fixed] = splits;
  if (!first) {
    return splits;
  }

  const left = fixed.reduce(
    (acc, split) => acc.minus(split?.sum ?? '0'),
    Money.from(sum)
  );

  return [{ ...first, sum: left.toString() }, ...fixed];
}
