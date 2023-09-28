import { ITask } from 'pg-promise';

import { ObjectId, TrackingSubjectData } from 'shared/types';
import { logger } from 'server/Logger';

import { insertTrackingSubject } from './TrackingDb';

export async function createTrackingSubject(
  tx: ITask<any>,
  groupId: ObjectId,
  userId: ObjectId,
  input: TrackingSubjectData,
) {
  const created = await insertTrackingSubject(tx, groupId, userId, input);
  logger.info({ input, created }, `Created new tracking subject for user ${userId}`);
}
