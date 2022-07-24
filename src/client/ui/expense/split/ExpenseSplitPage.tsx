import { Dialog, DialogContent, DialogTitle } from '@mui/material';
import * as React from 'react';

import { ExpenseDialogProps } from '../dialog/ExpenseDialog';

export const ExpenseSplitPage: React.FC<ExpenseDialogProps> = ({
  original,
  onClose,
}) => {
  if (!original) {
    return null;
  }

  return (
    <Dialog
      open={true}
      onClose={() => onClose(null)}
      scroll="paper"
      fullScreen={false}
    >
      <DialogTitle>Jaa kirjaus</DialogTitle>
      <DialogContent
        className="expense-dialog-content vertical-scroll-area"
        dividers={true}
        onClick={() => onClose(null)}
      >
        {original.id}
      </DialogContent>
    </Dialog>
  );
};
