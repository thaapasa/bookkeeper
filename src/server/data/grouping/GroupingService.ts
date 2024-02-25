import { ITask } from 'pg-promise';

import {
  ExpenseGrouping,
  ExpenseGroupingData,
  ExpenseGroupingWithExpenses,
  NotFoundError,
  ObjectId,
} from 'shared/types';
import { groupingImageHandler } from 'server/content/GroupingImage';
import { logger } from 'server/Logger';
import { FileUploadResult, safeDeleteFile } from 'server/server/FileHandling';

import {
  clearGroupingImageById,
  deleteExpenseGroupingById,
  getCategoryTotalsForGrouping,
  getExpenseGroupingById,
  getExpensesForGrouping,
  insertExpenseGrouping,
  setGroupingImageById,
  updateExpenseGroupingById,
} from './GroupingDb';

export async function getExpenseGrouping(
  tx: ITask<any>,
  groupId: ObjectId,
  groupingId: ObjectId,
): Promise<ExpenseGrouping> {
  const grouping = await getExpenseGroupingById(tx, groupId, groupingId);
  if (!grouping) {
    throw new NotFoundError('EXPENSE_GROUPING_NOT_FOUND', 'expense grouping', groupingId);
  }
  return grouping;
}

export async function createExpenseGrouping(
  tx: ITask<any>,
  groupId: ObjectId,
  userId: ObjectId,
  input: ExpenseGroupingData,
) {
  const created = await insertExpenseGrouping(tx, groupId, input);
  logger.info({ input, created }, `Created new expense grouping for user ${userId}`);
}

export async function updateExpenseGrouping(
  tx: ITask<any>,
  groupId: ObjectId,
  userId: ObjectId,
  groupingId: ObjectId,
  input: ExpenseGroupingData,
) {
  await getExpenseGrouping(tx, groupId, groupingId);
  const updated = await updateExpenseGroupingById(tx, groupingId, input);
  logger.info({ input, updated }, `Updated expense grouping ${groupingId} for user ${userId}`);
}

export async function deleteExpenseGrouping(
  tx: ITask<any>,
  groupId: ObjectId,
  userId: ObjectId,
  groupingId: ObjectId,
) {
  const grouping = await getExpenseGrouping(tx, groupId, groupingId);
  await deleteExpenseGroupingById(tx, groupingId);
  if (grouping.image) {
    await groupingImageHandler.deleteImages(grouping.image);
  }
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
    await getExpenseGrouping(tx, groupId, groupingId);
    logger.info(
      image,
      `Updating expense grouping image for user ${userId}, grouping ${groupingId}`,
    );
    const file = await groupingImageHandler.saveImages(image, { fit: 'cover' });
    await deleteExpenseGroupingImage(tx, groupId, userId, groupingId);
    await setGroupingImageById(tx, groupingId, file);
    return getExpenseGrouping(tx, groupId, groupingId);
  } finally {
    // Clear uploaded image
    await safeDeleteFile(image.filepath);
  }
}

export async function deleteExpenseGroupingImage(
  tx: ITask<any>,
  groupId: ObjectId,
  userId: ObjectId,
  groupingId: ObjectId,
): Promise<void> {
  const grouping = await getExpenseGrouping(tx, groupId, groupingId);
  if (!grouping.image) {
    logger.info(`No image for expense grouping ${groupingId}, skipping delete...`);
    return;
  }
  await groupingImageHandler.deleteImages(grouping.image);
  await clearGroupingImageById(tx, groupingId);
  logger.info(`Deleted expense grouping ${groupingId} image`);
}

export async function getGroupingWithExpenses(
  tx: ITask<any>,
  groupId: ObjectId,
  userId: ObjectId,
  groupingId: ObjectId,
): Promise<ExpenseGroupingWithExpenses> {
  const grouping = await getExpenseGrouping(tx, groupId, groupingId);
  const expenses = await getExpensesForGrouping(tx, groupId, userId, groupingId);
  const categoryTotals = await getCategoryTotalsForGrouping(tx, groupId, groupingId);
  return { ...grouping, expenses, categoryTotals };
}
