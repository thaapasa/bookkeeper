import { ITask } from 'pg-promise';

import {
  CategoryStatistics,
  CategoryStatisticsData,
} from 'shared/types/Statistics';
import { groupBy } from 'shared/util/Arrays';
import { toISODate, toMoment } from 'shared/util/Time';
import { DateRange } from 'shared/util/TimeRange';

async function loadCategoryStatisticsData(
  tx: ITask<any>,
  groupId: number,
  range: DateRange,
  categoryIds: number[]
): Promise<CategoryStatisticsData[]> {
  if (categoryIds.length < 1) {
    return [];
  }

  const statistics = await tx.manyOrNone<CategoryStatisticsData>(
    `SELECT SUM(sum), month, category_id AS "categoryId"
      FROM (
        SELECT sum, group_id, category_id, date, SUBSTRING(date::TEXT, 0, 8) AS month
        FROM expenses
      ) mexp
      WHERE group_id = $/groupId/
        AND date > $/start/
        AND date <= $/end/
        AND category_id IN ($/categoryIds:csv/)
      GROUP BY month, category_id
      ORDER BY month, category_id`,
    { groupId, start: range.startDate, end: range.endDate, categoryIds }
  );
  return statistics;
}

async function getCategoryStatistics(
  tx: ITask<any>,
  groupId: number,
  categoryIds: number[]
): Promise<CategoryStatistics> {
  const range = {
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
    categoryIds
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
