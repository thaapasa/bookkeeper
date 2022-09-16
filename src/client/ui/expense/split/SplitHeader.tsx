import { DialogTitle, Grid, Typography } from '@mui/material';
import * as React from 'react';

import { UserExpense } from 'shared/expense';
import { Money } from 'shared/util';

export const SplitHeader: React.FC<{ expense: UserExpense }> = ({
  expense,
}) => {
  return (
    <DialogTitle>
      <Grid
        container
        alignItems="flex-end"
        justifyContent="space-between"
        width="100%"
      >
        <Grid item xs={8}>
          <Typography variant="h5" component="div">
            {expense.title}
          </Typography>
        </Grid>
        <Grid item xs container justifyContent="flex-end">
          <Typography variant="h6" component="div" paddingLeft="16px">
            {Money.from(expense.sum).format()}
          </Typography>
        </Grid>
      </Grid>
      <Typography color="text.secondary" variant="body2">
        Pilko kirjaus osiin
      </Typography>
    </DialogTitle>
  );
};
