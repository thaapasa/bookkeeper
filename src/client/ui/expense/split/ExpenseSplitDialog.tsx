import { Dialog, Grid } from '@mui/material';
import * as React from 'react';

import { isMobileSize } from 'client/ui/Styles';

import { ExpenseDialogProps } from '../dialog/ExpenseDialog';
import { ExpenseDialogContent } from '../dialog/ExpenseDialogComponents';
import { useExpenseSplit } from './ExpenseSplit.hooks';
import { SplitButtons } from './SplitButtons';
import { SplitHeader } from './SplitHeader';
import { SplitRow } from './SplitRow';

export const ExpenseSplitDialog: React.FC<ExpenseDialogProps> = ({
  original,
  onClose,
  windowSize,
  ...props
}) => {
  const isMobile = isMobileSize(windowSize);

  const { addRow, splits, ...tools } = useExpenseSplit(original);

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
      <ExpenseDialogContent dividers={true}>
        <Grid container alignItems="center" spacing={2}>
          {splits.map((s, i) => (
            <SplitRow
              {...props}
              {...tools}
              key={s.key}
              split={s}
              splitIndex={i}
              editSum={i !== 0}
            />
          ))}
          <SplitButtons addRow={addRow} onClose={() => onClose(null)} />
        </Grid>
      </ExpenseDialogContent>
    </Dialog>
  );
};
