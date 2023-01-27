import moment, { Moment, MomentInput } from 'moment';
import { z } from 'zod';

import { IntString } from '../types/Primitives';
import { toMoment } from './Moment';

export const ISODateRegExp = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;
export const ISODatePattern = 'YYYY-MM-DD';
export const ISODate = z.string().regex(ISODateRegExp);
export type ISODate = z.infer<typeof ISODate>;

export const ISOMonthRegExp = /^[0-9]{4}-[0-9]{2}$/;
export const ISOMonthPattern = 'YYYY-MM';
export const ISOMonth = z.string().regex(ISOMonthRegExp);
export type ISOMonth = z.infer<typeof ISOMonth>;

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

export type DateLike = Date | Moment | string;

export function month(year: number, mon: number): Moment {
  return moment({ year, month: mon - 1, day: 1 });
}

export function monthToYear(month: ISOMonth | ISODate): number {
  return Number(month.substring(0, 4));
}

export function toDate(d: DateLike): Date {
  if (d instanceof Date) {
    return d;
  }
  return toMoment(d).toDate();
}

export function toISODate(m?: MomentInput): ISODate {
  return toMoment(m).format(ISODatePattern);
}
export function fromISODate(str: any): Moment {
  return moment(str, ISODatePattern);
}

export function readableDate(date?: DateLike, long?: boolean): string {
  return date ? toMoment(date).format(long ? 'dd D.M.' : 'D.M.') : '-';
}

export function readableDateWithYear(date?: DateLike, long?: boolean): string {
  return date ? toMoment(date).format(long ? 'dd D.M.YYYY' : 'D.M.YYYY') : '-';
}

export function iso(m: any): string {
  return moment(m).format('YYYY-MM-DDTHH:mm:ssZ');
}

export function toYearName(x: DateLike) {
  const m = toMoment(x);
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
