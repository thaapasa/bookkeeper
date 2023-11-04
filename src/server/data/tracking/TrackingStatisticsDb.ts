import { ITask } from 'pg-promise';

import {
  DateRange,
  getMonthsInRange,
  getQuartersInRange,
  getYearsInRange,
  ISOMonth,
  ISOYear,
  monthToQuarter,
  Quarter,
  toDayjs,
  toISODate,
} from 'shared/time';
import { ObjectId, TrackingData, TrackingFrequency, TrackingStatistics } from 'shared/types';
import { assertUnreachable, Money, MoneyLike } from 'shared/util';

import { getCategoriesById } from '../CategoryDb';
import { getAllUsers } from '../UserDb';

const TRACKING_RAW_QUERY_MONTH = `SELECT e.category_id, e.sum, e.user_id, c.parent_id,
    SUBSTRING(e.date::TEXT, 0, 8) AS "month"
  FROM expenses e
  LEFT JOIN categories c ON (c.id = e.category_id)
  WHERE e.group_id = $/groupId/
    AND e.date >= $/startDate/ AND e.date <= $/endDate/`;

const RangeCreators = {
  year: (r: DateRange) => getYearsInRange(r).map(y => String(y) as ISOYear),
  quarter: getQuartersInRange,
  month: getMonthsInRange,
} satisfies Record<TrackingFrequency, (range: DateRange) => TimeSlot[]>;

export async function getTrackingStatistics(
  tx: ITask<any>,
  groupId: ObjectId,
  userId: ObjectId,
  data: TrackingData,
): Promise<TrackingStatistics> {
  const freq = getFreq(data);
  const range = getRange(data);
  const catIds = data.categories;
  if (!catIds?.length) {
    return { groups: [], range, statistics: [] };
  }

  const rows = await getCategoryStatisticsRows(
    tx,
    groupId,
    catIds,
    range,
    freq,
    data.separateByUser,
  );

  const slots = RangeCreators[freq](range);
  const cats = await getCategoriesById(tx, groupId, ...catIds);
  const catMap = Object.fromEntries(cats.map(c => [c.id, c]));
  const users = data.separateByUser ? await getAllUsers(tx, groupId) : undefined;
  const userIds = users?.map(u => u.id);
  return {
    groups: users
      ? users
          .map(u =>
            catIds.map(c => ({
              key: `c${c}-${u.id}` as const,
              label: `${catMap[c].name ?? String(c)} (${u.firstName})`,
            })),
          )
          .flat(1)
      : catIds.map(c => ({ key: `c${c}-0`, label: catMap[c].name ?? String(c) })),
    range,
    statistics: slots.map(timeSlot => groupedValues(rows, timeSlot, catIds, userIds)),
  };
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

/**
 * Time slot corresponding to the selected frequency:
 * - `[isoYear]`, when freq=year (e.g. "2023")
 * - `[isoYear]-Q[quarter]`, when freq=quarter (e.g. "2023-Q1" for Jan-Mar)
 * - `[isoMonth]`, when freq=month (e.g. "2023-03" for March)
 */
type TimeSlot = ISOMonth | Quarter | ISOYear;

interface StatisticsRow {
  categoryId: number;
  parentId: number;
  sum: MoneyLike;
  month: ISOMonth;
  timeSlot: TimeSlot;
  userId?: ObjectId;
}

async function getCategoryStatisticsRows(
  tx: ITask<any>,
  groupId: ObjectId,
  categoryIds: ObjectId[],
  range: DateRange,
  frequency: TrackingFrequency,
  byUserId?: boolean,
): Promise<StatisticsRow[]> {
  const rows = await tx.manyOrNone<Omit<StatisticsRow, 'timeSlot'>>(
    /*sql*/ `SELECT
        category_id AS "categoryId",
        parent_id AS "parentId",
        ${byUserId ? `MIN(user_id) AS "userId",` : ''}
        SUM(sum) AS "sum",
        month
      FROM (
        ${TRACKING_RAW_QUERY_MONTH}
      ) joined
      WHERE category_id IN ($/categoryIds:csv/)
        OR parent_id IN ($/categoryIds:csv/)
      GROUP BY ${byUserId ? 'user_id, ' : ''} category_id, parent_id, month`,
    { groupId, categoryIds, startDate: range.startDate, endDate: range.endDate },
  );
  const fix = appendTimeslot.bind(null, frequency);
  return rows.map(fix);
}

function appendTimeslot(
  frequency: TrackingFrequency,
  row: Omit<StatisticsRow, 'timeSlot'>,
): StatisticsRow {
  switch (frequency) {
    case 'month':
      return { ...row, timeSlot: row.month };
    case 'year':
      return { ...row, timeSlot: row.month.substring(0, 4) as ISOYear };
    case 'quarter': {
      return { ...row, timeSlot: monthToQuarter(row.month) };
    }
    default:
      assertUnreachable(frequency, 'Tracking frequency');
  }
}

function groupedValues(
  rows: StatisticsRow[],
  timeSlot: TimeSlot,
  categoryIds: ObjectId[],
  userIds?: ObjectId[],
): Record<`c${number}-${number}`, number> & { timeSlot: string } {
  if (!userIds) {
    return { timeSlot, ...valuesByCategoryIds(rows, timeSlot, categoryIds) };
  }
  return userIds.reduce(
    (p, u) => ({ ...p, ...valuesByCategoryIds(rows, timeSlot, categoryIds, u) }),
    { timeSlot },
  );
}

function valuesByCategoryIds(
  rows: StatisticsRow[],
  timeSlot: TimeSlot,
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
