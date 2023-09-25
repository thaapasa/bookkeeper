import { ITask } from 'pg-promise';

import { ExpenseShortcutPayload } from 'shared/expense';
import { ObjectId } from 'shared/types';
import { logger } from 'server/Logger';

import { deleteShortcutById, getShortcutById, updateShortcutById } from './ShortcutDb';

export async function updateShortcutData(
  tx: ITask<any>,
  groupId: ObjectId,
  userId: ObjectId,
  shortcutId: ObjectId,
  data: ExpenseShortcutPayload,
): Promise<void> {
  await getShortcutById(tx, groupId, userId, shortcutId);
  await updateShortcutById(tx, shortcutId, data);
  logger.info(data, `Updated shortcut`);
}

export async function deleteShortcut(
  tx: ITask<any>,
  groupId: ObjectId,
  userId: ObjectId,
  shortcutId: ObjectId,
): Promise<void> {
  await getShortcutById(tx, groupId, userId, shortcutId);
  await deleteShortcutById(tx, shortcutId);
  logger.info(`Deleted shortcut ${shortcutId}`);
}
