import { ExpenseSaveAction } from 'client/ui/expense/dialog/ExpenseSaveAction';

/**
 * Represents a request to open the expense dialog. Used as the shared state
 * between the code that triggers the dialog (e.g. "edit expense" or "new expense")
 * and the dialog component that renders it.
 *
 * Generic parameter `D` is the dialog result type — `ExpenseInEditor` for the
 * main expense dialog, `ExpenseSplit[]` for the split dialog.
 */
export interface ExpenseDialogObject<D> {
  /** Expense ID to edit, or `null` when creating a new expense. */
  expenseId: number | null;
  /** Promise resolve callback — called with the result on save, or `null` on cancel. */
  resolve: (e: D | null) => void;
  /** Optional pre-filled values for the dialog form. */
  values?: Partial<D>;
  /** Custom save action; defaults to the standard create/update API call. */
  saveAction?: ExpenseSaveAction;
  /** Custom dialog title override. */
  title?: string;
}
