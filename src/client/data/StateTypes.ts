import { AlertColor } from '@mui/material';

import { TypedDateRange } from 'shared/time';
import { ExpenseSaveAction } from 'client/ui/expense/dialog/ExpenseSaveAction';

export interface Notification {
  message: string;
  cause?: any;
  severity?: AlertColor;
  immediate?: boolean;
}

export interface ExpenseDialogObject<D> {
  expenseId: number | null;
  resolve: (e: D | null) => void;
  values?: Partial<D>;
  saveAction?: ExpenseSaveAction;
}

export interface NavigationConfig {
  pathPrefix: string;
  dateRange: TypedDateRange;
}
