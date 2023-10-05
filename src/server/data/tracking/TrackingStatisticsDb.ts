import { ITask } from 'pg-promise';

import { DateRange, getMonthsInRange, ISOMonth, toDayjs, toISODate } from 'shared/time';
import { ObjectId, TrackingData, TrackingStatistics } from 'shared/types';
import { Money, MoneyLike } from 'shared/util';

import { getCategoriesById } from '../CategoryDb';

const TRACKING_RAW_QUERY = `SELECT e.category_id, e.sum, e.user_id, c.parent_id,
    SUBSTRING(e.date::TEXT, 0, 8) AS month
  FROM expenses e
  LEFT JOIN categories c ON (c.id = e.category_id)
  WHERE e.group_id = $/groupId/
    AND e.date >= $/startDate/ AND e.date <= $/endDate/`;

export async function getTrackingStatistics(
  tx: ITask<any>,
  groupId: ObjectId,
  userId: ObjectId,
  data: TrackingData,
): Promise<TrackingStatistics> {
  const range = getRange(data);
  const cats = data.categories;
  if (!cats?.length) {
    return { groups: [], range, statistics: [] };
  }
  return simpleCategoryStatistics(tx, groupId, cats, range);
}

function getRange(data: TrackingData): DateRange {
  const monthEnd = toDayjs().endOf('month');
  return {
    startDate: toISODate(
      monthEnd.subtract(data.range?.amount ?? 3, data.range?.unit ?? 'years').startOf('month'),
    ),
    endDate: toISODate(monthEnd),
  };
}

interface StatisticsRow {
  categoryId: number;
  parentId: number;
  sum: MoneyLike;
  month: ISOMonth;
}

async function simpleCategoryStatistics(
  tx: ITask<any>,
  groupId: ObjectId,
  categoryIds: ObjectId[],
  range: DateRange,
): Promise<TrackingStatistics> {
  const rows = await tx.manyOrNone<StatisticsRow>(
    `SELECT category_id AS "categoryId", parent_id AS "parentId", SUM(sum) AS "sum", month FROM (
        ${TRACKING_RAW_QUERY}
      ) joined
      WHERE category_id IN ($/categoryIds:csv/) OR parent_id IN ($/categoryIds:csv/)
      GROUP BY category_id, parent_id, month`,
    { groupId, categoryIds, startDate: range.startDate, endDate: range.endDate },
  );
  const months = getMonthsInRange(range);
  const cats = await getCategoriesById(tx, groupId, ...categoryIds);
  const catMap = Object.fromEntries(cats.map(c => [c.id, c]));
  return {
    groups: categoryIds.map(c => ({ key: `c${c}`, label: catMap[c].fullName ?? String(c) })),
    range,
    statistics: months.map(month => ({ month, ...valuesByCategoryIds(rows, month, categoryIds) })),
  };
}

function valuesByCategoryIds(
  rows: StatisticsRow[],
  month: ISOMonth,
  categoryIds: ObjectId[],
): Record<`c${number}`, number> {
  const res: Record<`c${number}`, number> = {};
  categoryIds.forEach(
    c =>
      (res[`c${c}`] = rows
        .filter(r => r.month === month && (r.categoryId === c || r.parentId === c))
        .reduce(addMoney, Money.from(0))
        .valueOf()),
  );
  return res;
}

const addMoney = (m: Money, src: { sum: MoneyLike }) => m.plus(src.sum);
