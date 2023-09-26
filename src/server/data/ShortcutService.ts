import path, { basename } from 'path';
import { ITask } from 'pg-promise';

import { ExpenseShortcutPayload } from 'shared/expense';
import { ObjectId } from 'shared/types';
import { AssetDirectories } from 'server/content/Content';
import { createShortcutIcons } from 'server/content/ShortcutImage';
import { logger } from 'server/Logger';
import { FileUploadResult, safeDeleteFile } from 'server/server/FileHandling';

import {
  clearProfileImageById,
  deleteShortcutById,
  getShortcutById,
  setProfileImageById,
  updateShortcutById,
} from './ShortcutDb';

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

export async function uploadShortcutIcon(
  tx: ITask<any>,
  groupId: ObjectId,
  userId: ObjectId,
  shortcutId: ObjectId,
  image: FileUploadResult,
  margin: number,
) {
  try {
    await getShortcutById(tx, groupId, userId, shortcutId);
    logger.info(image, `Updating shortcut icon for user ${userId}, shortcut ${shortcutId}`);
    const file = await createShortcutIcons(image, margin);
    await setProfileImageById(tx, shortcutId, file);
  } finally {
    // Clear uploaded image
    await safeDeleteFile(image.filepath);
  }
}

export async function deleteShortcutIcon(
  tx: ITask<any>,
  groupId: ObjectId,
  userId: ObjectId,
  shortcutId: ObjectId,
): Promise<void> {
  const shortcut = await getShortcutById(tx, groupId, userId, shortcutId);
  if (!shortcut.icon) {
    logger.info(`No image for shortcut ${shortcutId}, skipping delete...`);
    return;
  }
  await safeDeleteFile(path.join(AssetDirectories.shortcutImage, basename(shortcut.icon)));
  await clearProfileImageById(tx, shortcutId);
  logger.info(`Deleted shortcut ${shortcutId} image`);
}
