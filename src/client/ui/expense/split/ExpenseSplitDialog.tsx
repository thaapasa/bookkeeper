import { Dialog, Divider, Grid } from '@mui/material';
import * as React from 'react';

import { ExpenseSplit } from 'shared/expense';
import { isMobileSize } from 'client/ui/Styles';

import { ExpenseDialogProps } from '../dialog/ExpenseDialog';
import { ExpenseDialogContent } from '../dialog/ExpenseDialogComponents';
import { useExpenseSplit } from './ExpenseSplit.hooks';
import { SplitButtons } from './SplitButtons';
import { SplitHeader } from './SplitHeader';
import { SplitRow } from './SplitRow';

export const ExpenseSplitDialog: React.FC<
  ExpenseDialogProps<ExpenseSplit[]>
> = ({ original, onClose, onExpensesUpdated, windowSize, ...props }) => {
  const isMobile = isMobileSize(windowSize);

  const { addRow, splits, validSplits, splitExpense, ...tools } =
    useExpenseSplit(original, props.sourceMap, onClose, onExpensesUpdated);

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
            <React.Fragment key={s.key}>
              {i !== 0 ? (
                <Grid item xs={12}>
                  <Divider flexItem />
                </Grid>
              ) : null}
              <SplitRow
                {...props}
                {...tools}
                split={s}
                splitIndex={i}
                editSum={i !== 0}
              />
            </React.Fragment>
          ))}
          <SplitButtons
            addRow={addRow}
            onClose={() => onClose(null)}
            splitExpense={validSplits ? splitExpense : undefined}
          />
        </Grid>
      </ExpenseDialogContent>
    </Dialog>
  );
};
