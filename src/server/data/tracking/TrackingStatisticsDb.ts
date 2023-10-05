import { ITask } from 'pg-promise';

import {
  DateRange,
  getMonthsInRange,
  getYearsInRange,
  ISOMonth,
  toDayjs,
  toISODate,
} from 'shared/time';
import { ObjectId, TrackingData, TrackingFrequency, TrackingStatistics } from 'shared/types';
import { Money, MoneyLike } from 'shared/util';

import { getCategoriesById } from '../CategoryDb';

const TRACKING_RAW_QUERY_MONTH = `SELECT e.category_id, e.sum, e.user_id, c.parent_id,
    SUBSTRING(e.date::TEXT, 0, 8) AS "timeSlot"
  FROM expenses e
  LEFT JOIN categories c ON (c.id = e.category_id)
  WHERE e.group_id = $/groupId/
    AND e.date >= $/startDate/ AND e.date <= $/endDate/`;

const TRACKING_RAW_QUERY_YEAR = `SELECT e.category_id, e.sum, e.user_id, c.parent_id,
    SUBSTRING(e.date::TEXT, 0, 5) AS "timeSlot"
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
  return (
    data.frequency === 'year' ? simpleCategoryStatisticsByYear : simpleCategoryStatisticsByMonth
  )(tx, groupId, cats, range);
}

function getFreq(data: TrackingData): TrackingFrequency {
  return data.frequency ?? 'month';
}

function getRange(data: TrackingData): DateRange {
  const past = toDayjs().subtract(data.range?.amount ?? 3, data.range?.unit ?? 'years');
  const freq = getFreq(data);
  return {
    startDate: toISODate(past.startOf(freq)),
    endDate: toISODate(toDayjs().endOf(freq)),
  };
}

interface StatisticsRow {
  categoryId: number;
  parentId: number;
  sum: MoneyLike;
  /** ISO month or just the year */
  timeSlot: ISOMonth | string;
}

async function simpleCategoryStatisticsByMonth(
  tx: ITask<any>,
  groupId: ObjectId,
  categoryIds: ObjectId[],
  range: DateRange,
): Promise<TrackingStatistics> {
  const rows = await tx.manyOrNone<StatisticsRow>(
    `SELECT category_id AS "categoryId", parent_id AS "parentId", SUM(sum) AS "sum", "timeSlot" FROM (
        ${TRACKING_RAW_QUERY_MONTH}
      ) joined
      WHERE category_id IN ($/categoryIds:csv/) OR parent_id IN ($/categoryIds:csv/)
      GROUP BY category_id, parent_id, "timeSlot"`,
    { groupId, categoryIds, startDate: range.startDate, endDate: range.endDate },
  );
  const months = getMonthsInRange(range);
  const cats = await getCategoriesById(tx, groupId, ...categoryIds);
  const catMap = Object.fromEntries(cats.map(c => [c.id, c]));
  return {
    groups: categoryIds.map(c => ({ key: `c${c}`, label: catMap[c].fullName ?? String(c) })),
    range,
    statistics: months.map(month => ({
      timeSlot: month,
      ...valuesByCategoryIds(rows, month, categoryIds),
    })),
  };
}

async function simpleCategoryStatisticsByYear(
  tx: ITask<any>,
  groupId: ObjectId,
  categoryIds: ObjectId[],
  range: DateRange,
): Promise<TrackingStatistics> {
  const rows = await tx.manyOrNone<StatisticsRow>(
    `SELECT category_id AS "categoryId", parent_id AS "parentId", SUM(sum) AS "sum", "timeSlot" FROM (
        ${TRACKING_RAW_QUERY_YEAR}
      ) joined
      WHERE category_id IN ($/categoryIds:csv/) OR parent_id IN ($/categoryIds:csv/)
      GROUP BY category_id, parent_id, "timeSlot"`,
    { groupId, categoryIds, startDate: range.startDate, endDate: range.endDate },
  );
  const years = getYearsInRange(range);
  const cats = await getCategoriesById(tx, groupId, ...categoryIds);
  const catMap = Object.fromEntries(cats.map(c => [c.id, c]));
  return {
    groups: categoryIds.map(c => ({ key: `c${c}`, label: catMap[c].fullName ?? String(c) })),
    range,
    statistics: years.map(year => ({
      timeSlot: String(year),
      ...valuesByCategoryIds(rows, String(year), categoryIds),
    })),
  };
}

function valuesByCategoryIds(
  rows: StatisticsRow[],
  timeSlot: string,
  categoryIds: ObjectId[],
): Record<`c${number}`, number> {
  const res: Record<`c${number}`, number> = {};
  categoryIds.forEach(
    c =>
      (res[`c${c}`] = rows
        .filter(r => r.timeSlot === timeSlot && (r.categoryId === c || r.parentId === c))
        .reduce(addMoney, Money.from(0))
        .valueOf()),
  );
  return res;
}

const addMoney = (m: Money, src: { sum: MoneyLike }) => m.plus(src.sum);
