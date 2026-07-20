import { NotFoundError, ObjectId, Source, SourcePatch } from 'shared/types';
import { DbTask } from 'server/data/Db.ts';
import { withSpan } from 'server/telemetry/Spans';

function getImage(img: string | undefined): string | undefined {
  return img ? `img/sources/${img}` : undefined;
}

interface SourceData extends Source {
  userId: ObjectId | null;
  share: number;
  cards: string[] | null;
}

function createGroupObject(rows: SourceData[]): Source[] {
  if (!rows || rows.length < 1) {
    return [];
  }
  return rows.reduce((list, v) => {
    if ((list[list.length - 1] ? list[list.length - 1].id : undefined) !== v.id) {
      list.push({
        id: v.id,
        name: v.name,
        abbreviation: v.abbreviation,
        shares: v.shares,
        users: [],
        image: getImage(v.image),
        statementFormat: v.statementFormat,
      });
    }
    // LEFT JOIN yields one all-null user row for sources with no source_users
    if (v.userId != null) {
      list[list.length - 1].users.push({ userId: v.userId, share: v.share, cards: v.cards ?? [] });
    }
    return list;
  }, [] as Source[]);
}

// ORDER BY keeps same-source rows adjacent for the fold above, and makes
// the source user order (= card display order) deterministic
const select = `--sql
SELECT
  s.id, s.group_id as "groupId", name, abbreviation, image,
  s.statement_format as "statementFormat",
  (SELECT SUM(share) FROM source_users WHERE source_id = s.id)::INTEGER AS shares,
  so.user_id as "userId", so.share, so.cards
FROM sources s
LEFT JOIN source_users so ON (so.source_id = s.id)`;

const selectOrder = `ORDER BY s.id, so.user_id`;

export async function getAllSources(tx: DbTask, groupId: number): Promise<Source[]> {
  const s = await tx.manyOrNone<SourceData>(
    `${select} WHERE group_id = $/groupId/::INTEGER ${selectOrder}`,
    {
      groupId,
    },
  );
  return createGroupObject(s);
}

export async function getSourceById(tx: DbTask, groupId: ObjectId, id: ObjectId): Promise<Source> {
  const s = await tx.manyOrNone<SourceData>(
    `${select} WHERE id=$/id/::INTEGER AND group_id=$/groupId/::INTEGER ${selectOrder}`,
    {
      id,
      groupId,
    },
  );
  if (!s || s.length < 1) {
    throw new NotFoundError('SOURCE_NOT_FOUND', 'source', id);
  }
  return createGroupObject(s)[0];
}

export function updateSource(
  tx: DbTask,
  groupId: ObjectId,
  id: ObjectId,
  data: SourcePatch,
): Promise<Source> {
  return withSpan('source.update', { 'app.group_id': groupId, 'app.source_id': id }, async () => {
    const source = await getSourceById(tx, groupId, id);
    // Partial patch: absent fields keep their current value. statementFormat
    // is nullable, so undefined (keep) and null (clear) must stay distinct.
    const name = data.name ?? source.name;
    const statementFormat =
      data.statementFormat === undefined ? source.statementFormat : data.statementFormat;
    await tx.none(
      `UPDATE sources
          SET name=$/name/, statement_format=$/statementFormat/
          WHERE id=$/id/ AND group_id=$/groupId/`,
      { id, groupId, name, statementFormat },
    );
    return { ...source, name, statementFormat };
  });
}

export function updateSourceUserCards(
  tx: DbTask,
  groupId: ObjectId,
  sourceId: ObjectId,
  userId: ObjectId,
  cards: string[],
): Promise<Source> {
  return withSpan(
    'source.update_user_cards',
    { 'app.group_id': groupId, 'app.source_id': sourceId, 'app.user_id': userId },
    async () => {
      // source_users has no group_id; the subselect carries the group constraint
      const result = await tx.result(
        `UPDATE source_users
            SET cards=$/cards/::TEXT[]
            WHERE user_id=$/userId/
              AND source_id IN (SELECT id FROM sources WHERE id=$/sourceId/ AND group_id=$/groupId/)`,
        { cards, userId, sourceId, groupId },
      );
      if (result.rowCount < 1) {
        throw new NotFoundError('SOURCE_USER_NOT_FOUND', 'source user', sourceId);
      }
      return getSourceById(tx, groupId, sourceId);
    },
  );
}
