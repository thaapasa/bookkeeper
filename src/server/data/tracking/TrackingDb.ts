import { ITask } from 'pg-promise';

import { ObjectId, TrackingSubject, TrackingSubjectData } from 'shared/types';

const TRACKING_FIELDS = /*sql*/ `id, group_id, user_id, sort_id, title, created, updated, image, tracking_info`;

export async function insertTrackingSubject(
  tx: ITask<any>,
  groupId: ObjectId,
  userId: ObjectId,
  data: TrackingSubjectData,
): Promise<TrackingSubject> {
  const c = await tx.none(
    `INSERT INTO tracking_subjects (group_id, user_id, sort_id, title)
      VALUES ($/groupId/, $/userId/,
        (SELECT MAX(sort_order) FROM tracking_subjects t2 WHERE t2.user_id = $/userId/ AND t2.group_id = $/groupId/) + 1,
        $/title/)
      RETURNING ${TRACKING_FIELDS}`,
    { groupId, userId, title: data.title },
  );
  return toTrackingSubject(c);
}

function toTrackingSubject(row: any): TrackingSubject {
  return {
    id: row.id,
    title: row.title,
    trackingInfo: row.tracking_info ?? {},
    image: row.image ?? undefined,
  };
}
