import { Cancel } from '@mui/icons-material';
import { Button, Dialog, Grid } from '@mui/material';
import * as React from 'react';

import { UserExpense } from 'shared/types/Expense';
import { ExpenseSplit } from 'shared/types/ExpenseSplit';
import { Add, Split } from 'client/ui/Icons';
import { isMobileSize } from 'client/ui/Styles';

import { ExpenseDialogProps } from '../dialog/ExpenseDialog';
import { ExpenseDialogContent } from '../dialog/ExpenseDialogComponents';
import { SplitHeader } from './SplitHeader';
import { SplitRow } from './SplitRow';

export const ExpenseSplitDialog: React.FC<ExpenseDialogProps> = ({
  original,
  onClose,
  windowSize,
  ...props
}) => {
  const isMobile = isMobileSize(windowSize);

  const [splits, setSplits] = React.useState<(ExpenseSplit | null)[]>([]);

  React.useEffect(() => {
    setSplits(initialSplit(original));
  }, [original]);

  const addRow = () => {
    setSplits([...splits, null]);
  };

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
            <SplitRow key={i} split={s} editSum={i !== 0} {...props} />
          ))}
          <Grid item xs={4} container justifyContent="flex-start">
            <Button
              startIcon={<Add />}
              variant="contained"
              color="secondary"
              onClick={addRow}
            >
              Lisää rivi
            </Button>
          </Grid>
          <Grid item xs={4} container justifyContent="center">
            <Button
              startIcon={<Cancel />}
              variant="outlined"
              onClick={() => onClose(null)}
            >
              Peruuta
            </Button>
          </Grid>
          <Grid item xs={4} container justifyContent="flex-end">
            <Button
              startIcon={<Split />}
              variant="contained"
              color="primary"
              disabled
            >
              Pilko
            </Button>
          </Grid>
        </Grid>
      </ExpenseDialogContent>
    </Dialog>
  );
};

function initialSplit(original?: UserExpense | null): ExpenseSplit[] {
  return original ? [{ ...original }] : [];
}
