import { ITask } from 'pg-promise';

import { ExpenseShortcutPayload } from 'shared/expense';
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

export async function updateShortcutData(
  tx: ITask<any>,
  groupId: ObjectId,
  userId: ObjectId,
  shortcutId: ObjectId,
  data: ExpenseShortcutPayload,
): Promise<ExpenseShortcut> {
  const shortcut = await getShortcutById(tx, groupId, userId, shortcutId);
  await tx.none(
    `UPDATE shortcuts
      SET title=$/title/, background=$/background/, expense=$/expense/
      WHERE id=$/shortcutId/`,
    {
      shortcutId,
      title: data.title,
      background: data.background,
      expense: data.expense,
    },
  );
  return rowToShortcut(shortcut);
}

function rowToShortcut(rowdata: ExpenseShortcut) {
  return {
    ...rowdata,
    icon: rowdata.icon || undefined,
    background: rowdata.background || undefined,
    expense: rowdata.expense ?? {},
  };
}
