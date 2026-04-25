import {
  NotFoundError,
  ObjectId,
  TrackingSubject,
  TrackingSubjectData,
  TrackingSubjectWithData,
} from 'shared/types';
import { trackingImageHandler } from 'server/content/TrackingImage';
import { DbTask } from 'server/data/Db.ts';
import { logger } from 'server/Logger';
import { FileUploadResult, safeDeleteFile } from 'server/server/FileHandling';
import { withSpan } from 'server/telemetry/Spans';

import {
  clearTrackingImageById,
  deleteTrackingSubjectById,
  getTrackingSubjectById,
  getTrackingSubjectsForUser,
  insertTrackingSubject,
  setTrackingImageById,
  updateTrackingSubjectById,
} from './TrackingDb';
import { getTrackingStatistics } from './TrackingStatisticsDb';

export async function getTrackingSubject(
  tx: DbTask,
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

export function createTrackingSubject(
  tx: DbTask,
  groupId: ObjectId,
  userId: ObjectId,
  input: TrackingSubjectData,
) {
  return withSpan(
    'tracking.create',
    { 'app.group_id': groupId, 'app.user_id': userId },
    async () => {
      const created = await insertTrackingSubject(tx, groupId, userId, input);
      logger.info({ input, created }, `Created new tracking subject for user ${userId}`);
    },
  );
}

export function getTrackingSubjectsWithData(
  tx: DbTask,
  groupId: ObjectId,
  userId: ObjectId,
): Promise<TrackingSubjectWithData[]> {
  return withSpan(
    'tracking.subjects_with_data',
    { 'app.group_id': groupId, 'app.user_id': userId },
    async () => {
      const subjects = await getTrackingSubjectsForUser(tx, groupId, userId);
      const result: TrackingSubjectWithData[] = [];
      for (const s of subjects) {
        const data = await withSpan(
          'tracking.statistics',
          { 'app.subject_id': s.id, 'app.subject_title': s.title },
          () => getTrackingStatistics(tx, groupId, userId, s.trackingData),
        );
        result.push({ ...s, data });
      }
      return result;
    },
  );
}

export function updateTrackingSubject(
  tx: DbTask,
  groupId: ObjectId,
  userId: ObjectId,
  subjectId: ObjectId,
  input: TrackingSubjectData,
) {
  return withSpan(
    'tracking.update',
    { 'app.group_id': groupId, 'app.user_id': userId, 'app.subject_id': subjectId },
    async () => {
      await getTrackingSubject(tx, groupId, userId, subjectId);
      const updated = await updateTrackingSubjectById(tx, subjectId, input);
      logger.info({ input, updated }, `Updated tracking subject ${subjectId} for user ${userId}`);
    },
  );
}

export function deleteTrackingSubject(
  tx: DbTask,
  groupId: ObjectId,
  userId: ObjectId,
  subjectId: ObjectId,
) {
  return withSpan(
    'tracking.delete',
    { 'app.group_id': groupId, 'app.user_id': userId, 'app.subject_id': subjectId },
    async () => {
      await getTrackingSubject(tx, groupId, userId, subjectId);
      await deleteTrackingSubjectById(tx, subjectId);
      logger.info(`Deleted tracking subject ${subjectId} from user ${userId}`);
    },
  );
}

export function changeTrackingSubjectColor(
  tx: DbTask,
  groupId: ObjectId,
  userId: ObjectId,
  subjectId: ObjectId,
) {
  return withSpan(
    'tracking.change_color',
    { 'app.group_id': groupId, 'app.user_id': userId, 'app.subject_id': subjectId },
    async () => {
      const subject = await getTrackingSubject(tx, groupId, userId, subjectId);
      await updateTrackingSubjectById(tx, subjectId, {
        ...subject,
        trackingData: {
          ...subject.trackingData,
          colorOffset: (subject.trackingData?.colorOffset ?? 0) + 1,
        },
      });
      logger.info(`Deleted tracking subject ${subjectId} from user ${userId}`);
    },
  );
}

export function uploadTrackingImage(
  tx: DbTask,
  groupId: ObjectId,
  userId: ObjectId,
  subjectId: ObjectId,
  image: FileUploadResult,
) {
  return withSpan(
    'tracking.upload_image',
    { 'app.group_id': groupId, 'app.user_id': userId, 'app.subject_id': subjectId },
    async () => {
      try {
        await getTrackingSubject(tx, groupId, userId, subjectId);
        logger.info(image, `Updating tracking image for user ${userId}, subject ${subjectId}`);
        const file = await trackingImageHandler.saveImages(image, { fit: 'cover' });
        await deleteTrackingImage(tx, groupId, userId, subjectId);
        await setTrackingImageById(tx, subjectId, file);
        return getTrackingSubject(tx, groupId, userId, subjectId);
      } finally {
        await safeDeleteFile(image.filepath);
      }
    },
  );
}

export function deleteTrackingImage(
  tx: DbTask,
  groupId: ObjectId,
  userId: ObjectId,
  subjectId: ObjectId,
): Promise<void> {
  return withSpan(
    'tracking.delete_image',
    { 'app.group_id': groupId, 'app.user_id': userId, 'app.subject_id': subjectId },
    async () => {
      const subject = await getTrackingSubject(tx, groupId, userId, subjectId);
      if (!subject.image) {
        logger.info(`No image for tracked subject ${subjectId}, skipping delete...`);
        return;
      }
      await trackingImageHandler.deleteImages(subject.image);
      await clearTrackingImageById(tx, subjectId);
      logger.info(`Deleted subject ${subjectId} image`);
    },
  );
}
