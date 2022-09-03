import { IBaseProtocol } from 'pg-promise';

import { NotFoundError } from 'shared/types/Errors';
import { Source } from 'shared/types/Session';

function getImage(img: string | undefined): string | undefined {
  return img ? `img/sources/${img}` : undefined;
}

interface SourceData extends Source {
  userId: number;
  share: number;
}

function createGroupObject(rows: SourceData[]): Source[] {
  if (!rows || rows.length < 1) {
    return [];
  }
  return rows.reduce((list, v) => {
    if (
      (list[list.length - 1] ? list[list.length - 1].id : undefined) !== v.id
    ) {
      list.push({
        id: v.id,
        name: v.name,
        abbreviation: v.abbreviation,
        shares: v.shares,
        users: [],
        image: getImage(v.image),
      });
    }
    list[list.length - 1].users.push({ userId: v.userId, share: v.share });
    return list;
  }, [] as Source[]);
}

const select = `--sql
SELECT
  s.id, s.group_id as "groupId", name, abbreviation, image,
  (SELECT SUM(share) FROM source_users WHERE source_id = s.id)::INTEGER AS shares,
  so.user_id as "userId", so.share
FROM sources s
LEFT JOIN source_users so ON (so.source_id = s.id)`;

async function getAll(
  tx: IBaseProtocol<any>,
  groupId: number
): Promise<Source[]> {
  const s = await tx.manyOrNone<SourceData>(
    `${select} WHERE group_id = $/groupId/::INTEGER`,
    { groupId }
  );
  return createGroupObject(s);
}

async function getById(
  tx: IBaseProtocol<any>,
  groupId: number,
  id: number
): Promise<Source> {
  const s = await tx.manyOrNone<SourceData>(
    `${select} WHERE id=$/id/::INTEGER AND group_id=$/groupId/::INTEGER`,
    { id, groupId }
  );
  if (!s || s.length < 1) {
    throw new NotFoundError('SOURCE_NOT_FOUND', 'source');
  }
  return createGroupObject(s)[0];
}

export const SourceDb = {
  getById,
  getAll,
};
