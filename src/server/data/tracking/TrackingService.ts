import { ITask } from 'pg-promise';

import { NotFoundError, ObjectId, TrackingSubject, TrackingSubjectData } from 'shared/types';
import { logger } from 'server/Logger';

import {
  deleteTrackingSubjectById,
  getTrackingSubjectById,
  insertTrackingSubject,
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
