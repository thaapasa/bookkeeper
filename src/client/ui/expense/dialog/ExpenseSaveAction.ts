import { ExpenseData, RecurringExpenseTarget, UserExpenseWithDetails } from 'shared/expense';
import { apiConnect } from 'client/data/ApiConnect';
import { logger } from 'client/Logger';
import { UserPrompts } from 'client/ui/dialog/DialogState';
import { executeOperation } from 'client/util/ExecuteOperation';

/**
 * The save action that is called when expense editor save button is pressed.
 * Resolves to the saved expense id on success (0 when the implementation does
 * not persist to the server), or null when the user cancelled or the save failed.
 */
export type ExpenseSaveAction = (
  expense: ExpenseData,
  original: UserExpenseWithDetails | null,
) => Promise<number | null>;

/**
 * This is the default implementation of the expense save action
 */
export const defaultExpenseSaveAction: ExpenseSaveAction = async (expense, original) => {
  const createNew = !original;
  logger.info(expense, createNew ? 'Create new expense' : 'Save expense');

  const name = expense.title;
  const res = await executeOperation(
    async (): Promise<number | null> => {
      if (original) {
        if (original.subscriptionId) {
          if (!(await saveRecurring(original.id, expense))) {
            // User canceled, break out
            return null;
          }
          return original.id;
        }
        const r = await apiConnect.updateExpense(original.id, expense);
        return r.expenseId;
      }
      const r = await apiConnect.storeExpense(expense);
      return r.expenseId;
    },
    {
      success: `${createNew ? 'Tallennettu' : 'Päivitetty'} ${name}`,
    },
  );
  return res ?? null;
};

async function saveRecurring(originalId: number, data: ExpenseData): Promise<boolean> {
  const target = await UserPrompts.select<RecurringExpenseTarget>(
    'Tallenna toistuva kirjaus',
    'Mitä kirjauksia haluat muuttaa?',
    [
      { label: 'Vain tämä', value: 'single' },
      { label: 'Kaikki', value: 'all' },
      { label: 'Tästä eteenpäin', value: 'after' },
    ],
  );
  if (!target) {
    return false;
  }
  await apiConnect.updateRecurringExpense(originalId, data, target);
  return true;
}
