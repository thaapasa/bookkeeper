import * as React from 'react';

import { ExpenseSplit, UserExpenseWithDetails } from 'shared/expense';
import { toMoment } from 'shared/time';
import { MakeOptional } from 'shared/types';
import { IdProvider } from 'shared/util';
import apiConnect from 'client/data/ApiConnect';
import { logger } from 'client/Logger';

import { ExpenseDialogProps } from '../dialog/ExpenseDialog';
import { getBenefitorsForExpense } from '../dialog/ExpenseDialogData';
import { calculateSplits, finalizeSplits, isSplitComplete } from './SplitCalc';

export type ExpenseSplitInEditor = Omit<
  MakeOptional<ExpenseSplit, 'categoryId' | 'sourceId'>,
  'division'
> & {
  benefit: number[];
  key: string;
};

const KeyProvider = new IdProvider();

type SourceMap = ExpenseDialogProps<any>['sourceMap'];

export function useExpenseSplit(
  original: UserExpenseWithDetails | null,
  sourceMap: SourceMap,
  onClose: ExpenseDialogProps<any>['onClose'],
  onExpensesUpdated: ExpenseDialogProps<any>['onExpensesUpdated'],
) {
  const [splits, setSplits] = React.useState<ExpenseSplitInEditor[]>([]);

  React.useEffect(() => {
    setSplits(initialSplit(original, sourceMap));
  }, [original, sourceMap]);

  const addRow = React.useCallback(() => {
    setSplits([...splits, emptySplit(original, sourceMap)]);
  }, [setSplits, splits, original, sourceMap]);

  const saveSplit = React.useCallback(
    (i: number, split: ExpenseSplitInEditor) => {
      logger.info(split, 'Saving split');
      const newSplits = [...splits];
      newSplits[i] = split;
      const fixedSplits = calculateSplits(newSplits, original?.sum ?? '0');
      setSplits(fixedSplits);
    },
    [setSplits, splits, original],
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
    [setSplits, splits, original],
  );

  const validSplits = splits.length > 1 && splits.every(isSplitComplete);

  const splitExpense = async () => {
    if (original && validSplits) {
      const finalized = finalizeSplits(original.type, splits, sourceMap);
      await apiConnect.splitExpense(original.id, finalized);
      onClose(finalized);
      onExpensesUpdated(toMoment(original.date));
    }
  };

  return { addRow, saveSplit, removeSplit, splits, validSplits, splitExpense };
}

export type SplitTools = ReturnType<typeof useExpenseSplit>;

function initialSplit(
  original: UserExpenseWithDetails | null,
  sourceMap: SourceMap,
): ExpenseSplitInEditor[] {
  return [
    original
      ? {
          sum: original.sum,
          title: original.title,
          key: KeyProvider.nextStr('splitrow-'),
          sourceId: original.sourceId,
          categoryId: original.categoryId,
          benefit: getBenefitorsForExpense(original, original.division, sourceMap),
        }
      : emptySplit(original, sourceMap),
  ];
}

function emptySplit(
  original: UserExpenseWithDetails | null,
  sourceMap: SourceMap,
): ExpenseSplitInEditor {
  return {
    sum: '0',
    title: '',
    key: KeyProvider.nextStr('splitrow-'),
    sourceId: original?.sourceId,
    categoryId: original?.categoryId,
    benefit: original ? getBenefitorsForExpense(original, original.division, sourceMap) : [],
  };
}
