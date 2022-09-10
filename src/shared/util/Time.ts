import moment, { isMoment, Moment, MomentInput } from 'moment';
import { z } from 'zod';

require('moment/locale/fi');

export const fiLocale = 'fi-FI';

// Setup Finnish locale globally
moment.locale(fiLocale);

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

export const displayDatePattern = 'D.M.YYYY';

export type DateLike = Date | Moment | string;

export function month(year: number, mon: number): Moment {
  return moment({ year, month: mon - 1, day: 1 });
}

export function monthToYear(month: ISOMonth | ISODate): number {
  return Number(month.substring(0, 4));
}

export function toMoment(d?: MomentInput, pattern?: string): Moment {
  if (isMoment(d)) {
    return d;
  }
  return moment(d, pattern);
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

export function iso(m: any): string {
  return moment(m).format('YYYY-MM-DDTHH:mm:ssZ');
}

const months = [
  '',
  'Tammikuu',
  'Helmikuu',
  'Maaliskuu',
  'Huhtikuu',
  'Toukokuu',
  'Kesäkuu',
  'Heinäkuu',
  'Elokuu',
  'Syyskuu',
  'Lokakuu',
  'Marraskuu',
  'Joulukuu',
];

export function getFinnishMonthName(
  monthNumber: number | string | DateLike
): string {
  if (typeof monthNumber === 'number') {
    return months[monthNumber];
  }
  if (typeof monthNumber === 'string' && /^[0-9]*$/.exec(monthNumber)) {
    return months[parseInt(monthNumber, 10)];
  }
  const i = toMoment(monthNumber).get('month') + 1;
  return months[i];
}

export function toMonthName(x: DateLike) {
  const m = toMoment(x);
  return getFinnishMonthName(m.get('month') + 1) + ' ' + m.get('year');
}

export function toYearName(x: DateLike) {
  const m = toMoment(x);
  return '' + m.get('year');
}

export function isSameMonth(a: DateLike, b: DateLike) {
  const am = toMoment(a);
  const bm = toMoment(b);
  if (am.get('year') !== bm.get('year')) {
    return false;
  }
  return am.get('month') === bm.get('month');
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

export async function timeout(ms: number): Promise<void> {
  return new Promise<void>(resolve => setTimeout(resolve, ms));
}

export async function timeoutImmediate(): Promise<void> {
  return new Promise<void>(resolve => setImmediate(resolve));
}
