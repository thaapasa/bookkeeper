import * as React from 'react';

import { MakeOptional } from 'shared/types/Common';
import { UserExpenseWithDetails } from 'shared/types/Expense';
import { ExpenseSplit } from 'shared/types/ExpenseSplit';
import { IdProvider } from 'shared/util/IdProvider';

import { calculateSplits } from './SplitCalc';

export type ExpenseSplitInEditor = MakeOptional<
  ExpenseSplit,
  'categoryId' | 'sourceId'
>;

const KeyProvider = new IdProvider();

export function useExpenseSplit(original: UserExpenseWithDetails | null) {
  const [splits, setSplits] = React.useState<ExpenseSplitInEditor[]>([]);

  React.useEffect(() => {
    setSplits(initialSplit(original));
  }, [original]);

  const addRow = () => {
    setSplits([...splits, emptySplit()]);
  };

  const saveSplit = React.useCallback(
    (i: number, split: ExpenseSplit) => {
      const newSplits = [...splits];
      newSplits[i] = split;
      const fixedSplits = calculateSplits(newSplits, original?.sum ?? '0');
      setSplits(fixedSplits);
    },
    [setSplits, splits, original]
  );

  const removeSplit = React.useCallback(
    (i: number) => {
      const newSplits = [...splits];
      newSplits.splice(i, 1);
      const fixedSplits = calculateSplits(newSplits, original?.sum ?? '0');
      setSplits(fixedSplits);
    },
    [setSplits, splits, original]
  );

  return { addRow, saveSplit, removeSplit, splits };
}

export type SplitTools = ReturnType<typeof useExpenseSplit>;

function initialSplit(
  original?: UserExpenseWithDetails | null
): ExpenseSplitInEditor[] {
  return [
    original
      ? { ...original, key: KeyProvider.nextStr('splitrow-') }
      : emptySplit(),
  ];
}

function emptySplit(): ExpenseSplitInEditor {
  return {
    sum: '0',
    title: '',
    key: KeyProvider.nextStr('splitrow-'),
  };
}
