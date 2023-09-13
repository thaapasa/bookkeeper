import debug from 'debug';

import { ExpenseData, RecurringExpenseTarget, UserExpenseWithDetails } from 'shared/expense';
import apiConnect from 'client/data/ApiConnect';
import { UserPrompts } from 'client/ui/dialog/DialogState';
import { executeOperation } from 'client/util/ExecuteOperation';

const log = debug('bookkeeper:expense-dialog:save');

/**
 * This is the save action that is called when expense editor save button is pressed
 */
export type ExpenseSaveAction = (
  expense: ExpenseData,
  original: UserExpenseWithDetails | null,
) => Promise<boolean>;

/**
 * This is the default implementation of the expense save action
 */
export const defaultExpenseSaveAction: ExpenseSaveAction = async (expense, original) => {
  const createNew = !original;
  log(createNew ? 'Create new expense' : 'save expense', expense);

  const name = expense.title;
  const res = await executeOperation(
    async () => {
      if (original) {
        if (original.recurringExpenseId) {
          if (!(await saveRecurring(original.id, expense))) {
            // User canceled, break out
            return false;
          }
        } else {
          await apiConnect.updateExpense(original.id, expense);
        }
      } else {
        await apiConnect.storeExpense(expense);
      }
      return true;
    },
    {
      success: `${createNew ? 'Tallennettu' : 'Päivitetty'} ${name}`,
    },
  );
  return res ?? false;
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
