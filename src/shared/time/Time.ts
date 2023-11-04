import 'dayjs/locale/fi';

import dayjs, { Dayjs } from 'dayjs';
import dayOfYear from 'dayjs/plugin/dayOfYear';
import isLeapYear from 'dayjs/plugin/isLeapYear';
import isoWeek from 'dayjs/plugin/isoWeek';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import quarterOfYear from 'dayjs/plugin/quarterOfYear';
import utc from 'dayjs/plugin/utc';
import { z } from 'zod';

import { IntString } from '../types/Primitives';
import { leftPad } from '../util/Util';

export type DayjsInput = dayjs.ConfigType;

export const ISODateRegExp = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;
export const ISODatePattern = 'YYYY-MM-DD';
export const ISODate = z.custom<`${number}-${number}-${number}`>(
  val => typeof val === 'string' && ISODateRegExp.test(val),
);
export type ISODate = z.infer<typeof ISODate>;

export const ISOMonthRegExp = /^[0-9]{4}-[0-9]{2}$/;
export const ISOMonthPattern = 'YYYY-MM';
export const ISOMonth = z.custom<`${number}-${number}`>(
  val => typeof val === 'string' && ISOMonthRegExp.test(val),
);
export type ISOMonth = z.infer<typeof ISOMonth>;

export const ISOYearRegExp = /^[0-9]{4}$/;
export const ISOYearPatter = 'YYYY';
export const ISOYear = z.custom<`${number}`>(
  val => typeof val === 'string' && ISOYearRegExp.test(val),
);
export type ISOYear = z.infer<typeof ISOYear>;

export const Year = z.number().int().min(1500).max(3000);
export type Year = z.infer<typeof Year>;
export const Month = z.number().int().min(1).max(12);
export type Month = z.infer<typeof Month>;

export const YearMonth = z.object({
  year: IntString.refine(r => r >= 1500 && r <= 3000),
  month: IntString.refine(r => r >= 1 && r <= 12),
});
export type YearMonth = z.infer<typeof YearMonth>;

export const displayDatePattern = 'D.M.YYYY';

export type DateLike = Date | Dayjs | string;
export const fiLocale = 'fi';

dayjs.extend(isLeapYear);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
dayjs.extend(dayOfYear);
dayjs.extend(quarterOfYear);
dayjs.extend(utc);
dayjs.extend(isoWeek);

// Setup Finnish locale globally
dayjs.locale(fiLocale);

dayjs();

export function toDayjs(d?: DayjsInput, pattern?: string): Dayjs {
  if (dayjs.isDayjs(d)) {
    return d;
  }
  return dayjs(d, pattern);
}

export function dayJsForDate(
  year: number | string,
  month: number | string,
  day: number | string,
): Dayjs {
  return dayjs(
    `${leftPad(year, 4, '0')}-${leftPad(month, 2, '0')}-${leftPad(day, 2, '0')}`,
    ISODatePattern,
  );
}

export function toDate(d: DateLike): Date {
  if (d instanceof Date) {
    return d;
  }
  return toDayjs(d).toDate();
}

export function toISODate(m?: DayjsInput): ISODate {
  return toDayjs(m).format(ISODatePattern) as ISODate;
}

export function fromISODate(str: any): Dayjs {
  return toDayjs(str, ISODatePattern);
}

export function readableDate(date?: DateLike, long?: boolean): string {
  return date ? toDayjs(date).format(long ? 'dd D.M.' : 'D.M.') : '-';
}

export function readableDateWithYear(date?: DateLike, long?: boolean): string {
  return date ? toDayjs(date).format(long ? 'dd D.M.YYYY' : 'D.M.YYYY') : '-';
}

export function iso(m: any): string {
  return toDayjs(m).format('YYYY-MM-DDTHH:mm:ssZ');
}

export function toYearName(x: DateLike) {
  const m = toDayjs(x);
  return '' + m.get('year');
}

export function compareDates(first?: DateLike, second?: DateLike): number {
  if (!first) {
    return !second ? 0 : -1;
  }
  if (!second) {
    return 1;
  }
  const a = toDate(first).getTime();
  const b = toDate(second).getTime();
  if (a < b) {
    return -1;
  }
  if (a > b) {
    return 1;
  }
  return 0;
}

export function month(year: number, mon: number): Dayjs {
  return dayJsForDate(year, mon, 1);
}

export function monthToYear(month: ISOMonth | ISODate): number {
  return Number(month.substring(0, 4));
}
