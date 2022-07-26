import * as React from 'react';

import { UserExpenseWithDetails } from 'shared/types/Expense';
import { ExpenseSplit } from 'shared/types/ExpenseSplit';

import { calculateSplits } from './SplitCalc';

export function useExpenseSplit(original: UserExpenseWithDetails | null) {
  const [splits, setSplits] = React.useState<(ExpenseSplit | null)[]>([]);

  React.useEffect(() => {
    setSplits(initialSplit(original));
  }, [original]);

  const addRow = () => {
    setSplits([...splits, null]);
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

  return { addRow, saveSplit, splits };
}

function initialSplit(
  original?: UserExpenseWithDetails | null
): ExpenseSplit[] {
  return original ? [{ ...original }] : [];
}
