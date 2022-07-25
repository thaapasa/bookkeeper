import { Cancel } from '@mui/icons-material';
import { Button, Dialog, Grid } from '@mui/material';
import * as React from 'react';

import { UserExpense } from 'shared/types/Expense';
import { ExpenseSplit } from 'shared/types/ExpenseSplit';
import { Add, Split } from 'client/ui/Icons';
import { isMobileSize } from 'client/ui/Styles';

import { ExpenseDialogProps } from '../dialog/ExpenseDialog';
import { ExpenseDialogContent } from '../dialog/ExpenseDialogComponents';
import { calculateSplits } from './SplitCalc';
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

  const saveSplit = React.useCallback(
    (i: number, split: ExpenseSplit) => {
      const newSplits = [...splits];
      newSplits[i] = split;
      const fixedSplits = calculateSplits(newSplits, original?.sum ?? '0');
      setSplits(fixedSplits);
    },
    [setSplits, splits, original]
  );

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
              key={i}
              split={s}
              splitIndex={i}
              saveSplit={saveSplit}
              editSum={i !== 0}
            />
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
