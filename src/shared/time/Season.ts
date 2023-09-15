import dayjs, { Dayjs } from 'dayjs';
import { z } from 'zod';

import { ISODate, ISOMonth } from './Time';
import { DateRange, getMonthsInRange } from './TimeRange';

export const SeasonRegExp = /^[0-9]{4}-(Spring|Summer|Autumn|[0-9]{4}-Winter)$/;
/**
 * Season, expressed as `YYYY-Spring`, `YYYY-Summer`, `YYYY-Autumn`,
 * or `YYYY-YYYY-Winter`.
 *
 * Examples: `2022-Spring`, `2019-2020-Winter`.
 */
export const Season = z.string().regex(SeasonRegExp);
export type Season = z.infer<typeof Season>;

export function toSeason(m: Dayjs | ISODate | ISOMonth): Season {
  const asStr = dayjs.isDayjs(m) ? m.format('YYYY-MM') : m;
  const year = Number(asStr.substring(0, 4));
  // One-based month
  const month = Number(asStr.substring(5, 7));
  switch (month) {
    case 1:
    case 2:
      return `${year - 1}-${year}-Winter`;
    case 3:
    case 4:
    case 5:
      return `${year}-Spring`;
    case 6:
    case 7:
    case 8:
      return `${year}-Summer`;
    case 9:
    case 10:
    case 11:
      return `${year}-Autumn`;
    case 12:
      return `${year}-${year + 1}-Winter`;
    default:
      throw new Error(`Invalid date ${m}`);
  }
}

export function getSeasonsInRange(range: DateRange): Season[] {
  const months = getMonthsInRange(range);
  const seasons = months.map(toSeason);
  return [...new Set(seasons)];
}
