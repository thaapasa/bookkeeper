import { ITask } from 'pg-promise';

import { ExpenseGrouping, ExpenseGroupingData, ObjectId } from 'shared/types';
import { trackingImageHandler } from 'server/content/TrackingImage';

const GROUPING_FIELDS = /*sql*/ `id, title, created, updated, image, categories`;

export async function getExpenseGroupingsForUser(
  tx: ITask<any>,
  groupId: ObjectId,
  userId: ObjectId,
): Promise<ExpenseGrouping[]> {
  return [];
}

export async function getExpenseGroupingById(
  tx: ITask<any>,
  groupId: ObjectId,
  userId: ObjectId,
  subjectId: ObjectId,
): Promise<ExpenseGrouping | undefined> {
  return;
}

export async function insertExpenseGrouping(
  tx: ITask<any>,
  groupId: ObjectId,
  userId: ObjectId,
  data: ExpenseGroupingData,
): Promise<ExpenseGrouping> {
  return toExpenseGrouping({});
}

export async function updateExpenseGroupingById(
  tx: ITask<any>,
  subjectId: ObjectId,
  data: ExpenseGroupingData,
): Promise<ExpenseGrouping> {
  return toExpenseGrouping({});
}

export async function deleteExpenseGroupingById(
  tx: ITask<any>,
  groupingId: ObjectId,
): Promise<void> {
  // TODO
}

export async function setGroupingImageById(
  tx: ITask<any>,
  groupingId: ObjectId,
  image: string,
): Promise<void> {
  // TODO
}

export async function clearGroupingImageById(tx: ITask<any>, subjectId: ObjectId): Promise<void> {
  // TODO
}

function toExpenseGrouping(row: any): ExpenseGrouping {
  return {
    id: row.id,
    title: row.title,
    categories: row.categories ?? [],
    image: row.image ? trackingImageHandler.getVariant('image', row.image).webPath : undefined,
  };
}
