import { ExpenseShortcutPayload } from 'shared/expense';
import { BkError, isDefined, ObjectId } from 'shared/types';
import { shortcutImageHandler } from 'server/content/ShortcutImage';
import { DbTask } from 'server/data/Db.ts';
import { logger } from 'server/Logger';
import { FileUploadResult, safeDeleteFile } from 'server/server/FileHandling';
import { withSpan } from 'server/telemetry/Spans';

import { getCategoryById } from './CategoryDb';
import {
  clearShortcutIconById,
  deleteShortcutById,
  getShortcutById,
  insertNewShortcut,
  setShortcutIconById,
  updateShortcutById,
} from './ShortcutDb';
import { getSourceById } from './SourceDb';
import { getUserById } from './UserDb';

export function createShortcut(
  tx: DbTask,
  groupId: ObjectId,
  userId: ObjectId,
  data: ExpenseShortcutPayload,
): Promise<void> {
  return withSpan(
    'shortcut.create',
    { 'app.group_id': groupId, 'app.user_id': userId },
    async () => {
      await validateShortcutData(tx, groupId, data);
      await insertNewShortcut(tx, groupId, userId, data);
      logger.info(data, `Created new shortcut`);
    },
  );
}

export function updateShortcutData(
  tx: DbTask,
  groupId: ObjectId,
  userId: ObjectId,
  shortcutId: ObjectId,
  data: ExpenseShortcutPayload,
): Promise<void> {
  return withSpan(
    'shortcut.update',
    { 'app.group_id': groupId, 'app.user_id': userId, 'app.shortcut_id': shortcutId },
    async () => {
      await validateShortcutData(tx, groupId, data);
      await getShortcutById(tx, groupId, userId, shortcutId);
      await updateShortcutById(tx, shortcutId, data);
      logger.info(data, `Updated shortcut`);
    },
  );
}

async function validateShortcutData(tx: DbTask, groupId: ObjectId, data: ExpenseShortcutPayload) {
  try {
    for (const benefitUserId of data.expense.benefit ?? []) {
      // Verify user exists
      await getUserById(tx, groupId, benefitUserId);
    }
    if (isDefined(data.expense.sourceId)) {
      await getSourceById(tx, groupId, data.expense.sourceId);
    }
    if (data.expense.categoryId) {
      await getCategoryById(tx, groupId, data.expense.categoryId);
    }
  } catch (e) {
    if (e instanceof BkError && e.status === 404) {
      // Replace NOT_FOUND status with BAD_REQUEST
      e.status = 400;
    }
    throw e;
  }
}

export function deleteShortcut(
  tx: DbTask,
  groupId: ObjectId,
  userId: ObjectId,
  shortcutId: ObjectId,
): Promise<void> {
  return withSpan(
    'shortcut.delete',
    { 'app.group_id': groupId, 'app.user_id': userId, 'app.shortcut_id': shortcutId },
    async () => {
      await getShortcutById(tx, groupId, userId, shortcutId);
      await deleteShortcutById(tx, shortcutId);
      logger.info(`Deleted shortcut ${shortcutId}`);
    },
  );
}

export function uploadShortcutIcon(
  tx: DbTask,
  groupId: ObjectId,
  userId: ObjectId,
  shortcutId: ObjectId,
  image: FileUploadResult,
  margin: number,
) {
  return withSpan(
    'shortcut.upload_icon',
    { 'app.group_id': groupId, 'app.user_id': userId, 'app.shortcut_id': shortcutId },
    async () => {
      try {
        await getShortcutById(tx, groupId, userId, shortcutId);
        logger.info(image, `Updating shortcut icon for user ${userId}, shortcut ${shortcutId}`);
        const file = await shortcutImageHandler.saveImages(image, { margin, trim: true });
        await deleteShortcutIcon(tx, groupId, userId, shortcutId);
        await setShortcutIconById(tx, shortcutId, file);
        return getShortcutById(tx, groupId, userId, shortcutId);
      } finally {
        await safeDeleteFile(image.filepath);
      }
    },
  );
}

export function deleteShortcutIcon(
  tx: DbTask,
  groupId: ObjectId,
  userId: ObjectId,
  shortcutId: ObjectId,
): Promise<void> {
  return withSpan(
    'shortcut.delete_icon',
    { 'app.group_id': groupId, 'app.user_id': userId, 'app.shortcut_id': shortcutId },
    async () => {
      const shortcut = await getShortcutById(tx, groupId, userId, shortcutId);
      if (!shortcut.icon) {
        logger.info(`No icon for shortcut ${shortcutId}, skipping delete...`);
        return;
      }
      await shortcutImageHandler.deleteImages(shortcut.icon);
      await clearShortcutIconById(tx, shortcutId);
      logger.info(`Deleted shortcut ${shortcutId} icon`);
    },
  );
}
