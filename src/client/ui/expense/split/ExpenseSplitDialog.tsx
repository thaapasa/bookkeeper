import { Dialog, Typography } from '@mui/material';
import * as React from 'react';

import { UserExpense } from 'shared/types/Expense';
import { ExpenseSplit } from 'shared/types/ExpenseSplit';
import { isMobileSize } from 'client/ui/Styles';

import { ExpenseDialogProps } from '../dialog/ExpenseDialog';
import { ExpenseDialogContent } from '../dialog/ExpenseDialogComponents';
import { SplitHeader } from './SplitHeader';
import { SplitRow } from './SplitRow';

export const ExpenseSplitDialog: React.FC<ExpenseDialogProps> = ({
  original,
  onClose,
  windowSize,
}) => {
  const isMobile = isMobileSize(windowSize);

  const [splits, setSplits] = React.useState<ExpenseSplit[]>([]);

  React.useEffect(() => {
    setSplits(initialSplit(original));
  }, [original]);

  if (!original) {
    return null;
  }

  return (
    <Dialog
      open={true}
      onClose={() => onClose(null)}
      scroll="paper"
      fullScreen={isMobile}
    >
      <SplitHeader expense={original} />
      <ExpenseDialogContent dividers={true} onClick={() => onClose(null)}>
        <Typography color="text.secondary" variant="body2">
          Pilko kirjaus osiin
        </Typography>
        {splits.map((s, i) => (
          <SplitRow key={i} split={s} editSum={i !== 0} />
        ))}
      </ExpenseDialogContent>
    </Dialog>
  );
};

function initialSplit(original?: UserExpense | null): ExpenseSplit[] {
  return original ? [{ ...original }] : [];
}
