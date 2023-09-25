import { ITask } from 'pg-promise';

import { ExpenseShortcut, NotFoundError, ObjectId } from 'shared/types';

const SHORTCUT_FIELDS = /*sql */ `id, title, icon, background, expense`;

export async function getShortcutsForUser(
  tx: ITask<any>,
  groupId: ObjectId,
  userId: ObjectId,
): Promise<ExpenseShortcut[]> {
  const shortcuts = await tx.manyOrNone<ExpenseShortcut>(
    `SELECT ${SHORTCUT_FIELDS}
      FROM shortcuts
      WHERE user_id=$/userId/ AND group_id=$/groupId/`,
    { userId, groupId },
  );
  return shortcuts.map(rowToShortcut);
}

export async function getShortcutById(
  tx: ITask<any>,
  groupId: ObjectId,
  userId: ObjectId,
  shortcutId: ObjectId,
): Promise<ExpenseShortcut> {
  const shortcut = await tx.oneOrNone<ExpenseShortcut>(
    `SELECT ${SHORTCUT_FIELDS}
      FROM shortcuts
      WHERE id=$/shortcutId/ AND user_id=$/userId/ AND group_id=$/groupId/`,
    { shortcutId, userId, groupId },
  );
  if (!shortcut) {
    throw new NotFoundError('SHORTCUT_NOT_FOUND', 'shortcut', shortcutId);
  }
  return rowToShortcut(shortcut);
}

function rowToShortcut(rowdata: ExpenseShortcut) {
  return {
    ...rowdata,
    icon: rowdata.icon ?? undefined,
    background: rowdata.icon ?? undefined,
    expense: rowdata.expense ?? {},
  };
}
