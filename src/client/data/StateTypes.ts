import { ExpenseSaveAction } from 'client/ui/expense/dialog/ExpenseSaveAction';

export interface ExpenseDialogObject<D> {
  expenseId: number | null;
  resolve: (e: D | null) => void;
  values?: Partial<D>;
  saveAction?: ExpenseSaveAction;
  title?: string;
}
