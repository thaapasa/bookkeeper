import { DialogTitle, Grid, Typography } from '@mui/material';
import * as React from 'react';

import { UserExpense } from 'shared/types/Expense';
import Money from 'shared/util/Money';

export const SplitHeader: React.FC<{ expense: UserExpense }> = ({
  expense,
}) => {
  return (
    <DialogTitle>
      <Grid container alignItems="flex-end" justifyContent="space-between">
        <Grid item>
          <Typography variant="h5" component="div">
            {expense.title}
          </Typography>
        </Grid>
        <Grid item xs>
          <Typography variant="h6" component="div" paddingLeft="16px">
            {Money.from(expense.sum).format()}
          </Typography>
        </Grid>
      </Grid>
    </DialogTitle>
  );
};
