import { leftPad } from './Util';
import moment, { Moment, isMoment, MomentInput } from 'moment';

export type DateLike = Date | Moment | string;

export function month(year: number, mon: number): Moment {
  return moment({ year, month: mon - 1, day: 1 });
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

const datePattern = 'YYYY-MM-DD';
export function formatDate(m: any): string {
  const mom = moment.isMoment(m) ? m : moment(m);
  return mom.format(datePattern);
}
export function fromDate(str: any): Moment {
  return moment(str, datePattern);
}
export function readableDate(date: DateLike): string {
  return toMoment(date).format('D.M.');
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

export interface DateRange {
  start: Date;
  end: Date;
}

export interface TypedDateRange extends DateRange {
  type: 'year' | 'month';
}

export function toMonthName(x: DateLike) {
  const m = toMoment(x);
  return getFinnishMonthName(m.get('month') + 1) + ' ' + m.get('year');
}

export function toYearName(x: DateLike) {
  const m = toMoment(x);
  return '' + m.get('year');
}

export function toDateRangeName(x: TypedDateRange) {
  switch (x.type) {
    case 'month':
      return toMonthName(x.start);
    case 'year':
      return toYearName(x.start);
    default:
      return '?';
  }
}

const yearRE = /[0-9]{4}/;

function fromYearValue(y: DateLike): Moment | undefined {
  if (typeof y === 'number' || (typeof y === 'string' && yearRE.test(y))) {
    const year = parseInt(y, 10);
    return moment(leftPad(year, 4, '0') + '-01-01');
  }
  return;
}

export function yearRange(date: DateLike): TypedDateRange {
  const m = fromYearValue(date) || toMoment(date);
  const start = m
    .clone()
    .startOf('year')
    .toDate();
  const end = m.endOf('year').toDate();
  return { start, end, type: 'year' };
}

export function monthRange(date: DateLike): TypedDateRange {
  const m = toMoment(date);
  const start = m
    .clone()
    .startOf('month')
    .toDate();
  const end = m.endOf('month').toDate();
  return { start, end, type: 'month' };
}

export function isSameMonth(a: DateLike, b: DateLike) {
  const am = toMoment(a);
  const bm = toMoment(b);
  if (am.get('year') !== bm.get('year')) {
    return false;
  }
  return am.get('month') === bm.get('month');
}

export function compareDates(first: DateLike, second: DateLike): number {
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

export function compareRanges(a: DateRange, b: DateRange) {
  if (!a) {
    return !b ? 0 : -1;
  }
  if (!b) {
    return 1;
  }
  const c = compareDates(a.start, b.start);
  if (c !== 0) {
    return c;
  }
  return compareDates(a.end, b.end);
}

export async function timeout(ms: number): Promise<void> {
  return new Promise<void>(resolve => setTimeout(resolve, ms));
}
