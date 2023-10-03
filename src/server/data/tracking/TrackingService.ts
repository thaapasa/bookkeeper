import { ITask } from 'pg-promise';

import { NotFoundError, ObjectId, TrackingSubject, TrackingSubjectData } from 'shared/types';
import { trackingImageHandler } from 'server/content/TrackingImage';
import { logger } from 'server/Logger';
import { FileUploadResult, safeDeleteFile } from 'server/server/FileHandling';

import {
  clearTrackingImageById,
  deleteTrackingSubjectById,
  getTrackingSubjectById,
  insertTrackingSubject,
  setTrackingImageById,
  updateTrackingSubjectById,
} from './TrackingDb';

export async function getTrackingSubject(
  tx: ITask<any>,
  groupId: ObjectId,
  userId: ObjectId,
  subjectId: ObjectId,
): Promise<TrackingSubject> {
  const subject = await getTrackingSubjectById(tx, groupId, userId, subjectId);
  if (!subject) {
    throw new NotFoundError('TRACKED_SUBJECT_NOT_FOUND', 'tracked subject', subjectId);
  }
  return subject;
}

export async function createTrackingSubject(
  tx: ITask<any>,
  groupId: ObjectId,
  userId: ObjectId,
  input: TrackingSubjectData,
) {
  const created = await insertTrackingSubject(tx, groupId, userId, input);
  logger.info({ input, created }, `Created new tracking subject for user ${userId}`);
}

export async function updateTrackingSubject(
  tx: ITask<any>,
  groupId: ObjectId,
  userId: ObjectId,
  subjectId: ObjectId,
  input: TrackingSubjectData,
) {
  await getTrackingSubject(tx, groupId, userId, subjectId);
  const updated = await updateTrackingSubjectById(tx, subjectId, input);
  logger.info({ input, updated }, `Updated tracking subject ${subjectId} for user ${userId}`);
}

export async function deleteTrackingSubject(
  tx: ITask<any>,
  groupId: ObjectId,
  userId: ObjectId,
  subjectId: ObjectId,
) {
  await getTrackingSubject(tx, groupId, userId, subjectId);
  await deleteTrackingSubjectById(tx, subjectId);
  logger.info(`Deleted tracking subject ${subjectId} from user ${userId}`);
}

export async function uploadTrackingImage(
  tx: ITask<any>,
  groupId: ObjectId,
  userId: ObjectId,
  subjectId: ObjectId,
  image: FileUploadResult,
) {
  try {
    await getTrackingSubject(tx, groupId, userId, subjectId);
    logger.info(image, `Updating tracking image for user ${userId}, subject ${subjectId}`);
    const file = await trackingImageHandler.saveImages(image, { fit: 'cover' });
    await deleteTrackingImage(tx, groupId, userId, subjectId);
    await setTrackingImageById(tx, subjectId, file);
    return getTrackingSubject(tx, groupId, userId, subjectId);
  } finally {
    // Clear uploaded image
    await safeDeleteFile(image.filepath);
  }
}

export async function deleteTrackingImage(
  tx: ITask<any>,
  groupId: ObjectId,
  userId: ObjectId,
  subjectId: ObjectId,
): Promise<void> {
  const subject = await getTrackingSubject(tx, groupId, userId, subjectId);
  if (!subject.image) {
    logger.info(`No image for tracked subject ${subjectId}, skipping delete...`);
    return;
  }
  await trackingImageHandler.deleteImages(subject.image);
  await clearTrackingImageById(tx, subjectId);
  logger.info(`Deleted subject ${subjectId} image`);
}
