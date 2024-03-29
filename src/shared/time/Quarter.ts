import dayjs, { Dayjs } from 'dayjs';
import { z } from 'zod';

import { numberRange } from '../util/Arrays';
import { ISODate, ISOMonth, toDayjs } from './Time';
import { DateRange, getYearsInRange } from './TimeRange';

export const QuarterRegExp = /^[0-9]{4}-Q[1-4]$/;
/**
 * Quarter, expressed as a string `YYYY-QN`, like `2022-Q1` for the first quarter
 * of year 2022.
 */
export const Quarter = z.custom<`${number}-Q${number}`>(
  val => typeof val === 'string' && QuarterRegExp.test(val),
);
export type Quarter = z.infer<typeof Quarter>;

export function toQuarter(m: Dayjs | ISODate | ISOMonth): Quarter {
  const asStr = dayjs.isDayjs(m) ? m.format('YYYY-MM') : m;
  const year = Number(asStr.substring(0, 4));
  // Zero-based month
  const month = Number(asStr.substring(5, 7)) - 1;
  return `${year}-Q${Math.floor(month / 3) + 1}`;
}

export function getQuartersInRange(range: DateRange): Quarter[] {
  const years = getYearsInRange(range);
  if (years.length < 1) return [];
  const startYear = years[0];
  const endYear = years[years.length - 1];
  return years
    .map(y =>
      numberRange(
        y === startYear ? Math.floor(toDayjs(range.startDate).month() / 3) + 1 : 1,
        y === endYear ? Math.floor(toDayjs(range.endDate).month() / 3) + 1 : 4,
      ).map(q => `${y}-Q${q}` as const),
    )
    .flat(1);
}

export function monthToQuarter(isoMonth: ISOMonth): Quarter {
  const year = Number(isoMonth.substring(0, 4));
  const month = Number(isoMonth.substring(5, 7));
  return `${year}-Q${Math.floor((month - 1) / 3) + 1}`;
}
