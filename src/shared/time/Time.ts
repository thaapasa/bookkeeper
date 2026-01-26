import { DateTime, Settings } from 'luxon';
import { z } from 'zod';

import { IntString } from '../types/Primitives';
import { leftPad } from '../util/Util';

export type DateTimeInput = DateTime | Date | string | null | undefined;

export const ISODateRegExp = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;
export const ISODatePattern = 'yyyy-MM-dd';
export const ISODate = z.custom<`${number}-${number}-${number}`>(
  val => typeof val === 'string' && ISODateRegExp.test(val),
);
export type ISODate = z.infer<typeof ISODate>;

export const ISOMonthRegExp = /^[0-9]{4}-[0-9]{2}$/;
export const ISOMonthPattern = 'yyyy-MM';
export const ISOMonth = z.custom<`${number}-${number}`>(
  val => typeof val === 'string' && ISOMonthRegExp.test(val),
);
export type ISOMonth = z.infer<typeof ISOMonth>;

export const ISOYearRegExp = /^[0-9]{4}$/;
export const ISOYearPatter = 'yyyy';
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

export const displayDatePattern = 'd.M.yyyy';

export type DateLike = Date | DateTime | string;
export const fiLocale = 'fi';

// Setup Finnish locale globally
Settings.defaultLocale = fiLocale;

export function toDateTime(d?: DateTimeInput, _pattern?: string): DateTime {
  if (DateTime.isDateTime(d)) {
    return d;
  }
  if (d instanceof Date) {
    return DateTime.fromJSDate(d);
  }
  if (typeof d === 'string') {
    // Try ISO format first
    const parsed = DateTime.fromISO(d);
    if (parsed.isValid) {
      return parsed;
    }
    // Fallback to SQL format
    return DateTime.fromSQL(d);
  }
  return DateTime.now();
}

export function dayJsForDate(
  year: number | string,
  month: number | string,
  day: number | string,
): DateTime {
  return DateTime.fromISO(
    `${leftPad(year, 4, '0')}-${leftPad(month, 2, '0')}-${leftPad(day, 2, '0')}`,
  );
}

export function toDate(d: DateLike): Date {
  if (d instanceof Date) {
    return d;
  }
  return toDateTime(d).toJSDate();
}

export function toISODate(m?: DateTimeInput): ISODate {
  return toDateTime(m).toFormat(ISODatePattern) as ISODate;
}

export function fromISODate(str: any): DateTime {
  return DateTime.fromISO(str);
}

export function readableDate(date?: DateLike, long?: boolean): string {
  return date ? toDateTime(date).toFormat(long ? 'ccc d.M.' : 'd.M.') : '-';
}

export function readableDateWithYear(date?: DateLike, long?: boolean): string {
  return date ? toDateTime(date).toFormat(long ? 'ccc d.M.yyyy' : 'd.M.yyyy') : '-';
}

export function iso(m: any): string {
  return toDateTime(m).toISO() ?? '';
}

export function toYearName(x: DateLike) {
  const m = toDateTime(x);
  return '' + m.year;
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

export function month(year: number, mon: number): DateTime {
  return dayJsForDate(year, mon, 1);
}

export function monthToYear(month: ISOMonth | ISODate): number {
  return Number(month.substring(0, 4));
}

// Re-export DateTime for type usage
export { DateTime };
