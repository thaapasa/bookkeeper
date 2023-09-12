import { Button, Grid } from '@mui/material';
import * as React from 'react';

import { isDefined } from 'shared/types';
import { Icons } from 'client/ui/icons/Icons';

import { SplitTools } from './ExpenseSplit.hooks';

export const SplitButtons: React.FC<{
  addRow: SplitTools['addRow'];
  onClose: () => void;
  splitExpense: (() => void) | undefined;
}> = ({ addRow, onClose, splitExpense }) => (
  <>
    <Grid item xs={4} container justifyContent="flex-start">
      <Button startIcon={<Icons.Add />} variant="contained" color="secondary" onClick={addRow}>
        Lisää rivi
      </Button>
    </Grid>
    <Grid item xs={4} container justifyContent="center">
      <Button startIcon={<Icons.Cancel />} variant="outlined" onClick={onClose}>
        Peruuta
      </Button>
    </Grid>
    <Grid item xs={4} container justifyContent="flex-end">
      <Button
        startIcon={<Icons.Split />}
        variant="contained"
        color="primary"
        disabled={!isDefined(splitExpense)}
        onClick={splitExpense}
      >
        Pilko
      </Button>
    </Grid>
  </>
);
