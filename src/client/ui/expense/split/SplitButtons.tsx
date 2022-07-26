import { Button, Grid } from '@mui/material';
import * as React from 'react';

import { Add, Cancel, Split } from 'client/ui/Icons';

import { SplitTools } from './ExpenseSplit.hooks';

export const SplitButtons: React.FC<{
  addRow: SplitTools['addRow'];
  onClose: () => void;
}> = ({ addRow, onClose }) => (
  <>
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
      <Button startIcon={<Cancel />} variant="outlined" onClick={onClose}>
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
  </>
);
