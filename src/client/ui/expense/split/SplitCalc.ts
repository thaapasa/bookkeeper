import { ExpenseSplit, ExpenseType } from 'shared/expense';
import { isDefined } from 'shared/types/Common';
import { Source } from 'shared/types/Session';
import { Money, MoneyLike, requireDefined } from 'shared/util';

import { calculateDivision } from '../dialog/ExpenseDialogData';
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
): split is ExpenseSplitInEditor {
  return (
    (Money.parse(split.sum)?.gt(0) ?? false) &&
    split.title !== '' &&
    split.benefit.length > 0 &&
    isDefined(split.categoryId) &&
    isDefined(split.sourceId)
  );
}

export function finalizeSplits(
  type: ExpenseType,
  splits: ExpenseSplitInEditor[],
  sourceMap: Record<number, Source>
): ExpenseSplit[] {
  return splits.map(s =>
    finalizeSplit(
      type,
      s,
      requireDefined(sourceMap[s.sourceId ?? 0], 'Expense source')
    )
  );
}

export function finalizeSplit(
  type: ExpenseType,
  split: ExpenseSplitInEditor,
  source: Source
): ExpenseSplit {
  const { benefit, key, ...rest } = split;
  return {
    ...rest,
    categoryId: requireDefined(split.categoryId, 'Category id'),
    sourceId: requireDefined(split.sourceId, 'Source id'),
    division: calculateDivision(type, split.sum, benefit, source),
  };
}
