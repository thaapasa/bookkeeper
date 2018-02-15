import moment, { isMoment } from 'moment';
import { leftPad } from './Util';

export type DateLike = Date | moment.Moment | string;

export function month(year: number, month: number): moment.Moment {
  return moment({ year: year, month: month - 1, day: 1 });
}

export function toMoment(d: DateLike): moment.Moment {
  if (isMoment(d)) { return d; }
  return moment(d);
}

export function toDate(d: DateLike): Date {
  if (d instanceof Date) { return d; }
  return toMoment(d).toDate();
}

const datePattern = 'YYYY-MM-DD';
export function formatDate(m: any): string {
  const mom = moment.isMoment(m) ? m : moment(m);
  return mom.format(datePattern);
}
export function fromDate(str: any): moment.Moment {
  return moment(str, datePattern);
}

export function iso(m: any): string {
  return moment(m).format('YYYY-MM-DDTHH:mm:ssZ');
}

const months = ['', 'Tammikuu', 'Helmikuu', 'Maaliskuu', 'Huhtikuu', 'Toukokuu', 'Kesäkuu', 'Heinäkuu', 'Elokuu',
  'Syyskuu', 'Lokakuu', 'Marraskuu', 'Joulukuu'];

export function getFinnishMonthName(monthNumber: number | DateLike): string {
  const i = typeof monthNumber === 'number' ? monthNumber : toMoment(monthNumber).get('month') + 1;
  return months[i];
}

export interface DateRange {
  start: Date;
  end: Date;
}

export interface TypedDateRange extends DateRange {
  type: 'year' | 'month';
}

const yearRE = /[0-9]{4}/;

function fromYearValue(y: DateLike): moment.Moment | undefined {
  if (typeof y === 'number' || (typeof y === 'string' && yearRE.test(y))) {
    const year = parseInt(y, 10);
    return moment(leftPad(year, 4, '0') + '-01-01');
  }
  return;
}

export function yearRange(date: DateLike): TypedDateRange {
  const m = fromYearValue(date) || toMoment(date);
  const start = m.clone().startOf('year').toDate();
  const end = m.endOf('year').toDate();
  return { start, end, type: 'year' };
}

export function monthRange(date: DateLike): TypedDateRange {
  const m = toMoment(date);
  const start = m.clone().startOf('month').toDate();
  const end = m.endOf('month').toDate();
  return { start, end, type: 'month' };
}

export function isSameMonth(a: DateLike, b: DateLike) {
  const am = toMoment(a);
  const bm = toMoment(b);
  if (am.get('year') !== bm.get('year')) { return false; }
  return am.get('month') === bm.get('month');
}

export function compareDates(first: DateLike, second: DateLike): number {
  if (!first) {
    return !second ? 0 : -1;
  }
  if (!second) { return 1; }
  const a = toDate(first).getTime();
  const b = toDate(second).getTime();
  if (a < b) { return -1; }
  if (a > b) { return 1; }
  return 0;
}

export function compareRanges(a: DateRange, b: DateRange) {
  if (!a) { return !b ? 0 : -1; }
  if (!b) { return 1; }
  const c = compareDates(a.start, b.start);
  if (c !== 0) { return c; }
  return compareDates(a.end, b.end);
}
