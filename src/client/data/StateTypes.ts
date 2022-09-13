import { AlertColor } from '@mui/material';

import { TypedDateRange } from 'shared/util/TimeRange';

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
}

export interface NavigationConfig {
  pathPrefix: string;
  dateRange: TypedDateRange;
}
