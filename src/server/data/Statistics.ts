import { ITask } from 'pg-promise';

import {
  CategoryStatistics,
  CategoryStatisticsData,
} from 'shared/types/Statistics';
import { groupBy } from 'shared/util/Arrays';
import { toMoment } from 'shared/util/Time';

import Categories from './Categories';

export async function loadCategoryStatisticsData(
  tx: ITask<any>,
  groupId: number,
  categoryIds: number[]
): Promise<CategoryStatisticsData[]> {
  if (categoryIds.length < 1) {
    return [];
  }
  const start = toMoment().subtract(5, 'years').startOf('year').format();
  const end = toMoment().endOf('year').format();

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
    { groupId, start, end, categoryIds }
  );
  return statistics;
}

export async function getCategoryStatistics(
  tx: ITask<any>,
  groupId: number,
  categoryIds: number[]
): Promise<CategoryStatistics> {
  const ids = await Categories.tx.expandSubCategories(tx, groupId, categoryIds);
  if (ids.length < 1) {
    return { categoryIds, statistics: {} };
  }
  const statistics = await loadCategoryStatisticsData(tx, groupId, ids);
  return {
    categoryIds: ids,
    statistics: groupBy(s => String(s.categoryId), statistics),
  };
}
