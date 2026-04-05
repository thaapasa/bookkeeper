import { ObjectId, TrackingSubject, TrackingSubjectData } from 'shared/types';
import { trackingImageHandler } from 'server/content/TrackingImage';
import { DbTask } from 'server/data/Db.ts';

const TRACKING_FIELDS = /*sql*/ `id, title, created, updated, image, tracking_data`;

export async function getTrackingSubjectsForUser(tx: DbTask, groupId: ObjectId, userId: ObjectId) {
  const rows = await tx.manyOrNone(
    `SELECT ${TRACKING_FIELDS} FROM tracked_subjects
      WHERE group_id=$/groupId/ AND user_id=$/userId/
      ORDER BY sort_order ASC`,
    { groupId, userId },
  );
  return rows.map(toTrackingSubject);
}

export async function getTrackingSubjectById(
  tx: DbTask,
  groupId: ObjectId,
  userId: ObjectId,
  subjectId: ObjectId,
): Promise<TrackingSubject | undefined> {
  const row = await tx.oneOrNone(
    `SELECT ${TRACKING_FIELDS} FROM tracked_subjects
      WHERE id=$/subjectId/ AND group_id=$/groupId/ AND user_id=$/userId/`,
    { groupId, userId, subjectId },
  );
  return row ? toTrackingSubject(row) : undefined;
}

export async function insertTrackingSubject(
  tx: DbTask,
  groupId: ObjectId,
  userId: ObjectId,
  data: TrackingSubjectData,
): Promise<TrackingSubject> {
  const c = await tx.one(
    `INSERT INTO tracked_subjects (group_id, user_id, sort_order, title, tracking_data)
      VALUES ($/groupId/, $/userId/,
        COALESCE((SELECT MAX(sort_order) FROM tracked_subjects t2 WHERE t2.user_id = $/userId/ AND t2.group_id = $/groupId/) + 1, 0),
        $/title/, $/trackingData/)
      RETURNING ${TRACKING_FIELDS}`,
    { groupId, userId, title: data.title, trackingData: data.trackingData },
  );
  return toTrackingSubject(c);
}

export async function updateTrackingSubjectById(
  tx: DbTask,
  subjectId: ObjectId,
  data: TrackingSubjectData,
): Promise<TrackingSubject> {
  const c = await tx.one(
    `UPDATE tracked_subjects
      SET title=$/title/, tracking_data=$/trackingData/
      WHERE id=$/subjectId/
      RETURNING ${TRACKING_FIELDS}`,
    { subjectId, title: data.title, trackingData: data.trackingData },
  );
  return toTrackingSubject(c);
}

export async function deleteTrackingSubjectById(tx: DbTask, subjectId: ObjectId): Promise<void> {
  await tx.none(
    `DELETE FROM tracked_subjects
      WHERE id=$/subjectId/`,
    { subjectId },
  );
}

export async function setTrackingImageById(
  tx: DbTask,
  subjectId: ObjectId,
  image: string,
): Promise<void> {
  await tx.none(
    `UPDATE tracked_subjects
      SET image=$/image/
      WHERE id=$/subjectId/`,
    { subjectId, image },
  );
}

export async function clearTrackingImageById(tx: DbTask, subjectId: ObjectId): Promise<void> {
  await tx.none(
    `UPDATE tracked_subjects
      SET image=NULL
      WHERE id=$/subjectId/`,
    { subjectId },
  );
}

function toTrackingSubject(row: any): TrackingSubject {
  return {
    id: row.id,
    title: row.title,
    trackingData: row.tracking_data ?? {},
    image: row.image ? trackingImageHandler.getVariant('image', row.image).webPath : undefined,
  };
}
