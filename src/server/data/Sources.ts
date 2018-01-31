import { db, DbAccess } from './Db';
import { Source } from '../../shared/types/Session';
import { NotFoundError } from '../../shared/types/Errors';

function getImage(img: string | undefined): string | undefined {
  return img ? `img/sources/${img}` : undefined;
}

interface SourceData extends Source {
  userId: number;
  share: number;
};

function createGroupObject(rows: SourceData[]): Source[] {
  if (!rows || rows.length < 1) { return []; }
  return rows.reduce((list, v) => {
    if ((list[list.length - 1] ? list[list.length - 1].id : undefined) !== v.id) {
      list.push({ id: v.id, name: v.name, abbreviation: v.abbreviation, shares: v.shares, users: [], image: getImage(v.image) });
    }
    list[list.length - 1].users.push({ userId: v.userId, share: v.share });
    return list;
  }, [] as Source[]);
}

const select = 'SELECT s.id, s.group_id, name, abbreviation, image, ' +
  '(SELECT SUM(share) FROM source_users WHERE source_id = s.id)::INTEGER AS shares, so.user_id, so.share ' +
  'FROM sources s ' +
  'LEFT JOIN source_users so ON (so.source_id = s.id)';

function getAll(tx: DbAccess) {
  return async (groupId: number): Promise<Source[]> => {
    const s = await tx.queryList('sources.get_all', `${select} WHERE group_id = $1::INTEGER`, [groupId]);
    return createGroupObject(s as SourceData[]);
  }
}

function getById(tx: DbAccess) {
  return async (groupId: number, id: number): Promise<Source> => {
    const s = await tx.queryList('sources.get_by_id',
      `${select} WHERE id=$1::INTEGER AND group_id=$2::INTEGER`, [id, groupId]);
    if (!s) { throw new NotFoundError('SOURCE_NOT_FOUND', 'source'); }
    return createGroupObject(s as SourceData[])[0];
  }
}

export default {
  getAll: getAll(db),
  getById: getById(db),
  tx: {
    getById: getById,
    getAll: getAll
  }
};
