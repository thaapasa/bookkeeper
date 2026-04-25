import { DateRange } from 'shared/time';
import {
  CategorySelection,
  CategoryStatistics,
  CategoryStatisticsData,
  ObjectId,
} from 'shared/types';
import { groupBy, partition } from 'shared/util';
import { DbTask } from 'server/data/Db.ts';
import { logger } from 'server/Logger';
import { withSpan } from 'server/telemetry/Spans';

function loadCategoryStatisticsData(
  tx: DbTask,
  groupId: ObjectId,
  /** Both start and end dates are included in search */
  rangeInclusive: DateRange,
  categoryIds: number[],
  userId: ObjectId | undefined,
): Promise<CategoryStatisticsData[]> {
  if (categoryIds.length < 1) {
    return Promise.resolve([]);
  }
  return withSpan(
    'statistics.load_alone',
    { 'app.group_id': groupId, 'app.category_count': categoryIds.length },
    () =>
      tx.manyOrNone<CategoryStatisticsData>(
        `SELECT SUM(sum), month, category_id AS "categoryId"
          FROM (
            SELECT CASE WHEN type = 'income' THEN -sum ELSE sum END AS sum,
              user_id, group_id, category_id, date, SUBSTRING(date::TEXT, 0, 8) AS month
            FROM expenses
            WHERE group_id = $/groupId/
              AND date >= $/start/
              AND date <= $/end/
              AND category_id IN ($/categoryIds:csv/)
              AND type IN ('expense', 'income')
              ${userId ? 'AND user_id = $/userId/' : ''}
          ) mexp
          GROUP BY month, category_id
          ORDER BY month, category_id`,
        {
          groupId,
          start: rangeInclusive.startDate,
          end: rangeInclusive.endDate,
          categoryIds,
          userId,
        },
      ),
  );
}

function loadCategoryStatisticsDataGroupedByParent(
  tx: DbTask,
  groupId: ObjectId,
  /** Both start and end dates are included in search */
  rangeInclusive: DateRange,
  categoryIds: number[],
  userId: ObjectId | undefined,
): Promise<CategoryStatisticsData[]> {
  if (categoryIds.length < 1) {
    return Promise.resolve([]);
  }
  return withSpan(
    'statistics.load_grouped',
    { 'app.group_id': groupId, 'app.category_count': categoryIds.length },
    () =>
      tx.manyOrNone<CategoryStatisticsData>(
        `SELECT SUM(sum), month, parent_id AS "categoryId"
          FROM (
            SELECT CASE WHEN e.type = 'income' THEN -e.sum ELSE e.sum END AS sum,
              e.user_id, e.group_id, e.category_id,
              COALESCE(c.parent_id, c.id) AS parent_id,
              e.date, SUBSTRING(e.date::TEXT, 0, 8) AS month
            FROM expenses e
            LEFT JOIN categories c ON (c.id = e.category_id)
            WHERE e.group_id = $/groupId/
              AND e.date >= $/start/
              AND e.date <= $/end/
              AND (e.category_id IN ($/categoryIds:csv/) OR c.parent_id IN ($/categoryIds:csv/))
              AND e.type IN ('expense', 'income')
              ${userId ? 'AND e.user_id = $/userId/' : ''}
          ) mexp
          GROUP BY month, parent_id
          ORDER BY month, parent_id`,
        {
          groupId,
          start: rangeInclusive.startDate,
          end: rangeInclusive.endDate,
          categoryIds,
          userId,
        },
      ),
  );
}

export function getCategoryStatistics(
  tx: DbTask,
  groupId: ObjectId,
  userId: ObjectId,
  categoryIds: CategorySelection[],
  /** Both start and end dates are included in search */
  rangeInclusive: DateRange,
  onlyOwn: boolean,
): Promise<CategoryStatistics> {
  if (categoryIds.length < 1) {
    return Promise.resolve({ categoryIds, statistics: {}, range: rangeInclusive });
  }
  return withSpan(
    'statistics.category',
    {
      'app.group_id': groupId,
      'app.user_id': userId,
      'app.category_count': categoryIds.length,
      'app.only_own': onlyOwn,
    },
    async () => {
      logger.debug(
        `Querying for statistics between ${rangeInclusive.startDate} - ${rangeInclusive.endDate}`,
      );
      const [groped, alone] = partition(i => i.grouped === true, categoryIds);
      const stAlone = await loadCategoryStatisticsData(
        tx,
        groupId,
        rangeInclusive,
        alone.map(c => c.id),
        onlyOwn ? userId : undefined,
      );
      const stGrouped = await loadCategoryStatisticsDataGroupedByParent(
        tx,
        groupId,
        rangeInclusive,
        groped.map(c => c.id),
        onlyOwn ? userId : undefined,
      );
      return {
        categoryIds,
        statistics: {
          ...groupBy(s => String(s.categoryId), stAlone),
          ...groupBy(s => String(s.categoryId), stGrouped),
        },
        range: rangeInclusive,
      };
    },
  );
}
