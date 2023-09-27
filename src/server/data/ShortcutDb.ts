import { ITask } from 'pg-promise';

import { ExpenseShortcutPayload } from 'shared/expense';
import { ExpenseShortcut, NotFoundError, ObjectId } from 'shared/types';

const SHORTCUT_FIELDS = /*sql */ `id, title, icon, background, expense, sort_order AS "sortOrder"`;

export async function getShortcutsForUser(
  tx: ITask<any>,
  groupId: ObjectId,
  userId: ObjectId,
): Promise<ExpenseShortcut[]> {
  const shortcuts = await tx.manyOrNone<ExpenseShortcut>(
    `SELECT ${SHORTCUT_FIELDS}
      FROM shortcuts
      WHERE user_id=$/userId/ AND group_id=$/groupId/
      ORDER BY sort_order ASC`,
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

export async function insertNewShortcut(
  tx: ITask<any>,
  groupId: ObjectId,
  userId: ObjectId,
  data: ExpenseShortcutPayload,
): Promise<ExpenseShortcut> {
  const row = await tx.one(
    `INSERT INTO shortcuts (group_id, user_id, sort_order, title, background, expense)
     VALUES ($/groupId/, $/userId/,
       (SELECT MAX(sort_order) FROM shortcuts s2 WHERE s2.user_id = $/userId/ AND s2.group_id = $/groupId/) + 1,
       $/title/, $/background/, $/expense/)
     RETURNING ${SHORTCUT_FIELDS}`,
    { groupId, userId, title: data.title, background: data.background, expense: data.expense },
  );
  return rowToShortcut(row);
}

export async function updateShortcutById(
  tx: ITask<any>,
  shortcutId: ObjectId,
  data: ExpenseShortcutPayload,
): Promise<void> {
  await tx.none(
    `UPDATE shortcuts
      SET title=$/title/,
        background=$/background/,
        expense=$/expense/,
        updated=NOW()
      WHERE id=$/shortcutId/`,
    {
      shortcutId,
      title: data.title,
      background: data.background,
      expense: data.expense,
    },
  );
}

export async function deleteShortcutById(tx: ITask<any>, shortcutId: ObjectId): Promise<void> {
  await tx.none(`DELETE FROM shortcuts WHERE id=$/shortcutId/`, { shortcutId });
}

export async function reorderUserShortcuts(
  tx: ITask<any>,
  groupId: ObjectId,
  userId: ObjectId,
): Promise<void> {
  await tx.none(
    `UPDATE shortcuts
      SET sort_order = data.num
      FROM (
        SELECT id, ROW_NUMBER() OVER () AS num
          FROM (SELECT * FROM shortcuts
            WHERE user_id=$/userId/ AND group_id=$/groupId/
            ORDER BY sort_order ASC
          ) AS data
        ) AS data
      WHERE shortcuts.id = data.id`,
    { userId, groupId },
  );
}

export async function clearShortcutIconById(tx: ITask<any>, shortcutId: ObjectId) {
  await tx.none(`UPDATE shortcuts SET icon=NULL WHERE id=$/shortcutId/`, { shortcutId });
}

export async function setShortcutIconById(tx: ITask<any>, shortcutId: ObjectId, filename: string) {
  await tx.none(`UPDATE shortcuts SET icon=$/filename/ WHERE id=$/shortcutId/`, {
    shortcutId,
    filename,
  });
}

export async function sortShortcutUpById(
  tx: ITask<any>,
  groupId: ObjectId,
  userId: ObjectId,
  shortcutId: ObjectId,
): Promise<void> {
  const shortcut = await getShortcutById(tx, groupId, userId, shortcutId);
  const rowAbove = await tx.oneOrNone(
    `SELECT ${SHORTCUT_FIELDS} FROM shortcuts
      WHERE user_id=$/userId/ AND group_id=$/groupId/
        AND sort_order < $/sortOrder/
      ORDER BY sort_order DESC
      LIMIT 1`,
    { userId, groupId, sortOrder: shortcut.sortOrder },
  );
  if (!rowAbove) {
    return;
  }
  const shortcutAbove = rowToShortcut(rowAbove);
  await switchSortOrder(tx, groupId, userId, shortcut, shortcutAbove);
}

export async function sortShortcutDownById(
  tx: ITask<any>,
  groupId: ObjectId,
  userId: ObjectId,
  shortcutId: ObjectId,
): Promise<void> {
  const shortcut = await getShortcutById(tx, groupId, userId, shortcutId);
  const rowBelow = await tx.oneOrNone(
    `SELECT ${SHORTCUT_FIELDS} FROM shortcuts
      WHERE user_id=$/userId/ AND group_id=$/groupId/
        AND sort_order > $/sortOrder/
      ORDER BY sort_order ASC
      LIMIT 1`,
    { userId, groupId, sortOrder: shortcut.sortOrder },
  );
  if (!rowBelow) {
    return;
  }
  const shortcutBelow = rowToShortcut(rowBelow);
  await switchSortOrder(tx, groupId, userId, shortcut, shortcutBelow);
}

async function switchSortOrder(
  tx: ITask<any>,
  groupId: ObjectId,
  userId: ObjectId,
  shortcut1: ExpenseShortcut,
  shortcut2: ExpenseShortcut,
) {
  await tx.none(`UPDATE shortcuts SET sort_order=$/sortOrder/ WHERE id=$/id/`, {
    id: shortcut1.id,
    sortOrder: shortcut2.sortOrder,
  });
  await tx.none(`UPDATE shortcuts SET sort_order=$/sortOrder/ WHERE id=$/id/`, {
    id: shortcut2.id,
    sortOrder: shortcut1.sortOrder,
  });
  await reorderUserShortcuts(tx, groupId, userId);
}

function rowToShortcut(rowdata: ExpenseShortcut): ExpenseShortcut {
  return {
    ...rowdata,
    icon: rowdata.icon ? `content/shortcut/${rowdata.icon}` : undefined,
    background: rowdata.background || undefined,
    expense: rowdata.expense ?? {},
  };
}
