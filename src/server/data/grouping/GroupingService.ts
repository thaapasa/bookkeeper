import { ITask } from 'pg-promise';

import { ExpenseGrouping, ExpenseGroupingData, NotFoundError, ObjectId } from 'shared/types';
import { groupingImageHandler } from 'server/content/GroupingImage';
import { logger } from 'server/Logger';
import { FileUploadResult, safeDeleteFile } from 'server/server/FileHandling';

import {
  clearGroupingImageById,
  deleteExpenseGroupingById,
  getExpenseGroupingById,
  insertExpenseGrouping,
  setGroupingImageById,
  updateExpenseGroupingById,
} from './GroupingDb';

export async function getExpenseGrouping(
  tx: ITask<any>,
  groupId: ObjectId,
  userId: ObjectId,
  groupingId: ObjectId,
): Promise<ExpenseGrouping> {
  const subject = await getExpenseGroupingById(tx, groupId, userId, groupingId);
  if (!subject) {
    throw new NotFoundError('EXPENSE_GROUPING_NOT_FOUND', 'expense grouping', groupingId);
  }
  return subject;
}

export async function createExpenseGrouping(
  tx: ITask<any>,
  groupId: ObjectId,
  userId: ObjectId,
  input: ExpenseGroupingData,
) {
  const created = await insertExpenseGrouping(tx, groupId, userId, input);
  logger.info({ input, created }, `Created new expense grouping for user ${userId}`);
}

export async function updateExpenseGrouping(
  tx: ITask<any>,
  groupId: ObjectId,
  userId: ObjectId,
  groupingId: ObjectId,
  input: ExpenseGroupingData,
) {
  await getExpenseGrouping(tx, groupId, userId, groupingId);
  const updated = await updateExpenseGroupingById(tx, groupingId, input);
  logger.info({ input, updated }, `Updated expense grouping ${groupingId} for user ${userId}`);
}

export async function deleteExpenseGrouping(
  tx: ITask<any>,
  groupId: ObjectId,
  userId: ObjectId,
  groupingId: ObjectId,
) {
  await getExpenseGrouping(tx, groupId, userId, groupingId);
  await deleteExpenseGroupingById(tx, groupingId);
  logger.info(`Deleted expense grouping ${groupingId} from user ${userId}`);
}

export async function uploadExpenseGroupingImage(
  tx: ITask<any>,
  groupId: ObjectId,
  userId: ObjectId,
  groupingId: ObjectId,
  image: FileUploadResult,
) {
  try {
    await getExpenseGrouping(tx, groupId, userId, groupingId);
    logger.info(image, `Updating expense grouping image for user ${userId}, subject ${groupingId}`);
    const file = await groupingImageHandler.saveImages(image, { fit: 'cover' });
    await deleteExpenseGroupingImage(tx, groupId, userId, groupingId);
    await setGroupingImageById(tx, groupingId, file);
    return getExpenseGrouping(tx, groupId, userId, groupingId);
  } finally {
    // Clear uploaded image
    await safeDeleteFile(image.filepath);
  }
}

export async function deleteExpenseGroupingImage(
  tx: ITask<any>,
  groupId: ObjectId,
  userId: ObjectId,
  subjectId: ObjectId,
): Promise<void> {
  const subject = await getExpenseGrouping(tx, groupId, userId, subjectId);
  if (!subject.image) {
    logger.info(`No image for expense grouping ${subjectId}, skipping delete...`);
    return;
  }
  await groupingImageHandler.deleteImages(subject.image);
  await clearGroupingImageById(tx, subjectId);
  logger.info(`Deleted expense grouping ${subjectId} image`);
}
