import { ITask } from 'pg-promise';

import { ObjectId } from 'shared/types/Id';
import {
  CategoryStatistics,
  CategoryStatisticsData,
} from 'shared/types/Statistics';
import { groupBy } from 'shared/util/Arrays';
import { toISODate, toMoment } from 'shared/util/Time';
import { DateRange } from 'shared/util/TimeRange';

async function loadCategoryStatisticsData(
  tx: ITask<any>,
  groupId: ObjectId,
  range: DateRange,
  categoryIds: number[],
  userId: ObjectId | undefined
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
    { groupId, start: range.startDate, end: range.endDate, categoryIds, userId }
  );
  return statistics;
}

async function getCategoryStatistics(
  tx: ITask<any>,
  groupId: ObjectId,
  userId: ObjectId,
  categoryIds: number[],
  inputRange: DateRange | undefined,
  onlyOwn: boolean
): Promise<CategoryStatistics> {
  const range = inputRange ?? {
    startDate: toISODate(toMoment().subtract(5, 'years').startOf('year')),
    endDate: toISODate(toMoment()),
  };
  if (categoryIds.length < 1) {
    return { categoryIds, statistics: {}, range };
  }
  const statistics = await loadCategoryStatisticsData(
    tx,
    groupId,
    range,
    categoryIds,
    onlyOwn ? userId : undefined
  );
  return {
    categoryIds,
    statistics: groupBy(s => String(s.categoryId), statistics),
    range,
  };
}

export const StatisticsDb = {
  getCategoryStatistics,
};
