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
import { getAllUsers } from '../UserDb';

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
  )(tx, groupId, cats, range, data.separateByUser);
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
  userId: ObjectId;
}

async function simpleCategoryStatisticsByMonth(
  tx: ITask<any>,
  groupId: ObjectId,
  categoryIds: ObjectId[],
  range: DateRange,
  byUserId?: boolean,
): Promise<TrackingStatistics> {
  const rows = await tx.manyOrNone<StatisticsRow>(
    `SELECT category_id AS "categoryId", parent_id AS "parentId", MIN(user_id) AS "userId", SUM(sum) AS "sum", "timeSlot" FROM (
        ${TRACKING_RAW_QUERY_MONTH}
      ) joined
      WHERE category_id IN ($/categoryIds:csv/) OR parent_id IN ($/categoryIds:csv/)
      GROUP BY ${byUserId ? 'user_id, ' : ''} category_id, parent_id, "timeSlot"`,
    { groupId, categoryIds, startDate: range.startDate, endDate: range.endDate },
  );
  const months = getMonthsInRange(range);
  const cats = await getCategoriesById(tx, groupId, ...categoryIds);
  const catMap = Object.fromEntries(cats.map(c => [c.id, c]));
  return {
    groups: categoryIds.map(c => ({ key: `c${c}-0`, label: catMap[c].fullName ?? String(c) })),
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
  byUserId?: boolean,
): Promise<TrackingStatistics> {
  const rows = await tx.manyOrNone<StatisticsRow>(
    `SELECT category_id AS "categoryId", parent_id AS "parentId", MIN(user_id) AS "userId", SUM(sum) AS "sum", "timeSlot" FROM (
        ${TRACKING_RAW_QUERY_YEAR}
      ) joined
      WHERE category_id IN ($/categoryIds:csv/) OR parent_id IN ($/categoryIds:csv/)
      GROUP BY ${byUserId ? 'user_id, ' : ''} category_id, parent_id, "timeSlot"`,
    { groupId, categoryIds, startDate: range.startDate, endDate: range.endDate },
  );
  const years = getYearsInRange(range);
  const cats = await getCategoriesById(tx, groupId, ...categoryIds);
  const catMap = Object.fromEntries(cats.map(c => [c.id, c]));
  const users = byUserId ? await getAllUsers(tx, groupId) : undefined;
  const userIds = users?.map(u => u.id);
  return {
    groups: users
      ? users
          .map(u =>
            categoryIds.map(c => ({
              key: `c${c}-${u.id}` as const,
              label: `${catMap[c].fullName ?? String(c)} (${u.firstName})`,
            })),
          )
          .flat(1)
      : categoryIds.map(c => ({ key: `c${c}-0`, label: catMap[c].fullName ?? String(c) })),
    range,
    statistics: years.map(year => ({
      timeSlot: String(year),
      ...groupedValues(rows, String(year), categoryIds, userIds),
    })),
  };
}

function groupedValues(
  rows: StatisticsRow[],
  timeSlot: string,
  categoryIds: ObjectId[],
  userIds?: ObjectId[],
): Record<`c${number}-${number}`, number> {
  if (!userIds) {
    return valuesByCategoryIds(rows, timeSlot, categoryIds);
  }
  return userIds.reduce(
    (p, u) => ({ ...p, ...valuesByCategoryIds(rows, timeSlot, categoryIds, u) }),
    {},
  );
}

function valuesByCategoryIds(
  rows: StatisticsRow[],
  timeSlot: string,
  categoryIds: ObjectId[],
  userId?: ObjectId,
): Record<`c${number}-${number}`, number> {
  const res: ReturnType<typeof valuesByCategoryIds> = {};
  categoryIds.forEach(
    c =>
      (res[`c${c}-${userId ?? 0}`] = rows
        .filter(
          r =>
            r.timeSlot === timeSlot &&
            (r.categoryId === c || r.parentId === c) &&
            (userId === undefined || r.userId === userId),
        )
        .reduce(addMoney, Money.from(0))
        .valueOf()),
  );
  return res;
}

const addMoney = (m: Money, src: { sum: MoneyLike }) => m.plus(src.sum);
