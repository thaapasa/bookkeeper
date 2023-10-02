import { ITask } from 'pg-promise';

import { ObjectId, TrackingSubject, TrackingSubjectData } from 'shared/types';

const TRACKING_FIELDS = /*sql*/ `id, title, created, updated, image, tracking_data`;

export async function insertTrackingSubject(
  tx: ITask<any>,
  groupId: ObjectId,
  userId: ObjectId,
  data: TrackingSubjectData,
): Promise<TrackingSubject> {
  const c = await tx.one(
    `INSERT INTO tracked_subjects (group_id, user_id, sort_order, title)
      VALUES ($/groupId/, $/userId/,
        (SELECT MAX(sort_order) FROM tracked_subjects t2 WHERE t2.user_id = $/userId/ AND t2.group_id = $/groupId/) + 1,
        $/title/)
      RETURNING ${TRACKING_FIELDS}`,
    { groupId, userId, title: data.title },
  );
  return toTrackingSubject(c);
}

export async function getTrackingSubjectsForUser(
  tx: ITask<any>,
  groupId: ObjectId,
  userId: ObjectId,
) {
  const rows = await tx.manyOrNone(
    `SELECT ${TRACKING_FIELDS} FROM tracked_subjects
      WHERE group_id=$/groupId/ AND user_id=$/userId/`,
    { groupId, userId },
  );
  return rows.map(toTrackingSubject);
}

function toTrackingSubject(row: any): TrackingSubject {
  return {
    id: row.id,
    title: row.title,
    trackingData: row.tracking_data ?? {},
    image: row.image ?? undefined,
  };
}
