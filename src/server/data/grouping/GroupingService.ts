import {
  ExpenseGrouping,
  ExpenseGroupingData,
  ExpenseGroupingWithExpenses,
  NotFoundError,
  ObjectId,
} from 'shared/types';
import { groupingImageHandler } from 'server/content/GroupingImage';
import { DbTask } from 'server/data/Db.ts';
import { logger } from 'server/Logger';
import { FileUploadResult, safeDeleteFile } from 'server/server/FileHandling';
import { withSpan } from 'server/telemetry/Spans';

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
  tx: DbTask,
  groupId: ObjectId,
  userId: ObjectId,
  groupingId: ObjectId,
): Promise<ExpenseGrouping> {
  const grouping = await getExpenseGroupingById(tx, groupId, userId, groupingId);
  if (!grouping) {
    throw new NotFoundError('EXPENSE_GROUPING_NOT_FOUND', 'expense grouping', groupingId);
  }
  return grouping;
}

export function createExpenseGrouping(
  tx: DbTask,
  groupId: ObjectId,
  userId: ObjectId,
  input: ExpenseGroupingData,
) {
  return withSpan(
    'grouping.create',
    { 'app.group_id': groupId, 'app.user_id': userId },
    async () => {
      const created = await insertExpenseGrouping(tx, groupId, userId, input);
      logger.info({ input, created }, `Created new expense grouping for user ${userId}`);
    },
  );
}

export function updateExpenseGrouping(
  tx: DbTask,
  groupId: ObjectId,
  userId: ObjectId,
  groupingId: ObjectId,
  input: ExpenseGroupingData,
) {
  return withSpan(
    'grouping.update',
    { 'app.group_id': groupId, 'app.user_id': userId, 'app.grouping_id': groupingId },
    async () => {
      await getExpenseGrouping(tx, groupId, userId, groupingId);
      const updated = await updateExpenseGroupingById(tx, groupingId, input);
      logger.info({ input, updated }, `Updated expense grouping ${groupingId} for user ${userId}`);
    },
  );
}

export function deleteExpenseGrouping(
  tx: DbTask,
  groupId: ObjectId,
  userId: ObjectId,
  groupingId: ObjectId,
) {
  return withSpan(
    'grouping.delete',
    { 'app.group_id': groupId, 'app.user_id': userId, 'app.grouping_id': groupingId },
    async () => {
      const grouping = await getExpenseGrouping(tx, groupId, userId, groupingId);
      await deleteExpenseGroupingById(tx, groupingId);
      if (grouping.image) {
        await groupingImageHandler.deleteImages(grouping.image);
      }
      logger.info(`Deleted expense grouping ${groupingId} from user ${userId}`);
    },
  );
}

export function uploadExpenseGroupingImage(
  tx: DbTask,
  groupId: ObjectId,
  userId: ObjectId,
  groupingId: ObjectId,
  image: FileUploadResult,
) {
  return withSpan(
    'grouping.upload_image',
    { 'app.group_id': groupId, 'app.user_id': userId, 'app.grouping_id': groupingId },
    async () => {
      try {
        await getExpenseGrouping(tx, groupId, userId, groupingId);
        logger.info(
          image,
          `Updating expense grouping image for user ${userId}, grouping ${groupingId}`,
        );
        const file = await groupingImageHandler.saveImages(image, { fit: 'cover' });
        await deleteExpenseGroupingImage(tx, groupId, userId, groupingId);
        await setGroupingImageById(tx, groupingId, file);
        return getExpenseGrouping(tx, groupId, userId, groupingId);
      } finally {
        await safeDeleteFile(image.filepath);
      }
    },
  );
}

export function deleteExpenseGroupingImage(
  tx: DbTask,
  groupId: ObjectId,
  userId: ObjectId,
  groupingId: ObjectId,
): Promise<void> {
  return withSpan(
    'grouping.delete_image',
    { 'app.group_id': groupId, 'app.user_id': userId, 'app.grouping_id': groupingId },
    async () => {
      const grouping = await getExpenseGrouping(tx, groupId, userId, groupingId);
      if (!grouping.image) {
        logger.info(`No image for expense grouping ${groupingId}, skipping delete...`);
        return;
      }
      await groupingImageHandler.deleteImages(grouping.image);
      await clearGroupingImageById(tx, groupingId);
      logger.info(`Deleted expense grouping ${groupingId} image`);
    },
  );
}

export function getGroupingWithExpenses(
  tx: DbTask,
  groupId: ObjectId,
  userId: ObjectId,
  groupingId: ObjectId,
): Promise<ExpenseGroupingWithExpenses> {
  return withSpan(
    'grouping.with_expenses',
    { 'app.group_id': groupId, 'app.user_id': userId, 'app.grouping_id': groupingId },
    async () => {
      const grouping = await getExpenseGrouping(tx, groupId, userId, groupingId);
      const expenses = await getExpensesForGrouping(tx, groupId, userId, groupingId);
      const categoryTotals = await getCategoryTotalsForGrouping(tx, groupId, userId, groupingId);
      return { ...grouping, expenses, categoryTotals };
    },
  );
}
