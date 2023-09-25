import { ITask } from 'pg-promise';

import { ExpenseShortcut, ObjectId } from 'shared/types';

export async function getShortcutsForUser(
  tx: ITask<any>,
  groupId: ObjectId,
  userId: ObjectId,
): Promise<ExpenseShortcut[]> {
  const shortcuts = await tx.manyOrNone<ExpenseShortcut>(
    `SELECT id, title, icon, background, expense
      FROM shortcuts
      WHERE user_id=$/userId/ AND group_id=$/groupId/`,
    { userId, groupId },
  );
  return shortcuts.map(rowToShortcut);
}

function rowToShortcut(rowdata: ExpenseShortcut) {
  return {
    ...rowdata,
    icon: rowdata.icon ?? undefined,
    background: rowdata.icon ?? undefined,
    expense: rowdata.expense ?? {},
  };
}
