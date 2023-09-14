import { ITask } from 'pg-promise';

import { DateRange } from 'shared/time';
import {
  CategorySelection,
  CategoryStatistics,
  CategoryStatisticsData,
  ObjectId,
} from 'shared/types';
import { groupBy, partition } from 'shared/util';
import { logger } from 'server/Logger';

async function loadCategoryStatisticsData(
  tx: ITask<any>,
  groupId: ObjectId,
  range: DateRange,
  categoryIds: number[],
  userId: ObjectId | undefined,
): Promise<CategoryStatisticsData[]> {
  if (categoryIds.length < 1) {
    return [];
  }

  const statistics = await tx.manyOrNone<CategoryStatisticsData>(
    `SELECT SUM(sum), month, category_id AS "categoryId"
      FROM (
        SELECT CASE WHEN type = 'income' THEN -sum ELSE sum END AS sum, 
          user_id, group_id, category_id, date, SUBSTRING(date::TEXT, 0, 8) AS month
        FROM expenses
        WHERE group_id = $/groupId/
          AND date > $/start/
          AND date <= $/end/
          AND template = false
          AND category_id IN ($/categoryIds:csv/)
          AND type IN ('expense', 'income')
          ${userId ? 'AND user_id = $/userId/' : ''}
      ) mexp
      GROUP BY month, category_id
      ORDER BY month, category_id`,
    {
      groupId,
      start: range.startDate,
      end: range.endDate,
      categoryIds,
      userId,
    },
  );
  return statistics;
}

async function loadCategoryStatisticsDataGroupedByParent(
  tx: ITask<any>,
  groupId: ObjectId,
  range: DateRange,
  categoryIds: number[],
  userId: ObjectId | undefined,
): Promise<CategoryStatisticsData[]> {
  if (categoryIds.length < 1) {
    return [];
  }

  const statistics = await tx.manyOrNone<CategoryStatisticsData>(
    `SELECT SUM(sum), month, parent_id AS "categoryId"
      FROM (
        SELECT CASE WHEN e.type = 'income' THEN -e.sum ELSE e.sum END AS sum, 
          e.user_id, e.group_id, e.category_id,
          COALESCE(c.parent_id, c.id) AS parent_id,
          e.date, SUBSTRING(e.date::TEXT, 0, 8) AS month
        FROM expenses e
        LEFT JOIN categories c ON (c.id = e.category_id)
        WHERE e.group_id = $/groupId/
          AND e.date > $/start/
          AND e.date <= $/end/
          AND e.template = false
          AND (e.category_id IN ($/categoryIds:csv/) OR c.parent_id IN ($/categoryIds:csv/))
          AND e.type IN ('expense', 'income')
          ${userId ? 'AND e.user_id = $/userId/' : ''}
      ) mexp
      GROUP BY month, parent_id
      ORDER BY month, parent_id`,
    {
      groupId,
      start: range.startDate,
      end: range.endDate,
      categoryIds,
      userId,
    },
  );
  return statistics;
}

export async function getCategoryStatistics(
  tx: ITask<any>,
  groupId: ObjectId,
  userId: ObjectId,
  categoryIds: CategorySelection[],
  range: DateRange,
  onlyOwn: boolean,
): Promise<CategoryStatistics> {
  if (categoryIds.length < 1) {
    return { categoryIds, statistics: {}, range };
  }
  logger.debug(`Querying for statistics between ${range.startDate} - ${range.endDate}`);
  const [groped, alone] = partition(i => i.grouped === true, categoryIds);
  const [stAlone, stGrouped] = await Promise.all([
    loadCategoryStatisticsData(
      tx,
      groupId,
      range,
      alone.map(c => c.id),
      onlyOwn ? userId : undefined,
    ),
    loadCategoryStatisticsDataGroupedByParent(
      tx,
      groupId,
      range,
      groped.map(c => c.id),
      onlyOwn ? userId : undefined,
    ),
  ]);
  return {
    categoryIds,
    statistics: {
      ...groupBy(s => String(s.categoryId), stAlone),
      ...groupBy(s => String(s.categoryId), stGrouped),
    },
    range,
  };
}
