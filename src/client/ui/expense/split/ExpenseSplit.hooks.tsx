import debug from 'debug';
import * as React from 'react';

import { MakeOptional } from 'shared/types/Common';
import { UserExpenseWithDetails } from 'shared/types/Expense';
import { ExpenseSplit } from 'shared/types/ExpenseSplit';
import { IdProvider } from 'shared/util/IdProvider';
import apiConnect from 'client/data/ApiConnect';

import { ExpenseDialogProps } from '../dialog/ExpenseDialog';
import { getBenefitorsForExpense } from '../dialog/ExpenseDialogData';
import { calculateSplits, isSplitComplete } from './SplitCalc';

const log = debug('ui:expense-split');

export type ExpenseSplitInEditor = MakeOptional<
  ExpenseSplit,
  'categoryId' | 'sourceId'
>;

const KeyProvider = new IdProvider();

type SourceMap = ExpenseDialogProps<any>['sourceMap'];

export function useExpenseSplit(
  original: UserExpenseWithDetails | null,
  sourceMap: SourceMap,
  onClose: (expense: ExpenseSplit[] | null) => void
) {
  const [splits, setSplits] = React.useState<ExpenseSplitInEditor[]>([]);

  React.useEffect(() => {
    setSplits(initialSplit(original, sourceMap));
  }, [original, sourceMap]);

  const addRow = React.useCallback(() => {
    setSplits([...splits, emptySplit(original, sourceMap)]);
  }, [setSplits, splits, original, sourceMap]);

  const saveSplit = React.useCallback(
    (i: number, split: ExpenseSplit) => {
      log('Saving split', split);
      const newSplits = [...splits];
      newSplits[i] = split;
      const fixedSplits = calculateSplits(newSplits, original?.sum ?? '0');
      setSplits(fixedSplits);
    },
    [setSplits, splits, original]
  );

  const removeSplit = React.useCallback(
    (i: number) => {
      // Do not allow deleting the first entry
      if (i === 0) return;
      const newSplits = [...splits];
      newSplits.splice(i, 1);
      const fixedSplits = calculateSplits(newSplits, original?.sum ?? '0');
      setSplits(fixedSplits);
    },
    [setSplits, splits, original]
  );

  const validSplits = splits.length > 1 && splits.every(isSplitComplete);

  const splitExpense = async () => {
    if (original && validSplits) {
      await apiConnect.splitExpense(original.id, splits);
      onClose(splits);
    }
  };

  return { addRow, saveSplit, removeSplit, splits, validSplits, splitExpense };
}

export type SplitTools = ReturnType<typeof useExpenseSplit>;

function initialSplit(
  original: UserExpenseWithDetails | null,
  sourceMap: SourceMap
): ExpenseSplitInEditor[] {
  return [
    original
      ? {
          sum: original.sum,
          title: original.title,
          key: KeyProvider.nextStr('splitrow-'),
          sourceId: original.sourceId,
          categoryId: original.categoryId,
          benefit: getBenefitorsForExpense(
            original,
            original.division,
            sourceMap
          ),
        }
      : emptySplit(original, sourceMap),
  ];
}

function emptySplit(
  original: UserExpenseWithDetails | null,
  sourceMap: SourceMap
): ExpenseSplitInEditor {
  return {
    sum: '0',
    title: '',
    key: KeyProvider.nextStr('splitrow-'),
    sourceId: original?.sourceId,
    categoryId: original?.categoryId,
    benefit: original
      ? getBenefitorsForExpense(original, original.division, sourceMap)
      : [],
  };
}
