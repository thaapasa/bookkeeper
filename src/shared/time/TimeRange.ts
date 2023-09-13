import { Moment } from 'moment';
import { z } from 'zod';

import { numberRange } from '../util/Arrays';
import { leftPad } from '../util/Util';
import { toMoment } from './Moment';
import { toMonthName } from './Months';
import {
  compareDates,
  DateLike,
  displayDatePattern,
  ISODate,
  ISOMonth,
  monthToYear,
  toYearName,
  Year,
} from './Time';

export const DateRange = z.object({
  startDate: ISODate,
  endDate: ISODate,
});
export type DateRange = z.infer<typeof DateRange>;

export interface UIDateRange {
  start: Date;
  end: Date;
}

export interface TypedDateRange extends UIDateRange {
  type: 'year' | 'month' | 'custom';
}

export interface MomentRange {
  startTime: Moment;
  endTime: Moment;
}

export function getYearsInRange(range: DateRange): Year[] {
  return numberRange(monthToYear(range.startDate), monthToYear(range.endDate));
}

export function getMonthsInRange(range: DateRange): ISOMonth[] {
  const years = getYearsInRange(range);
  if (years.length < 1) return [];
  const startYear = years[0];
  const endYear = years[years.length - 1];
  return years
    .map(y =>
      numberRange(
        y === startYear ? toMoment(range.startDate).month() + 1 : 1,
        y === endYear ? toMoment(range.endDate).month() + 1 : 12,
      ).map(m => `${y}-${leftPad(m, 2, '0')}`),
    )
    .flat(1);
}

export function dateRangeToMomentRange(r: DateRange) {
  return {
    startTime: toMoment(r.startDate).startOf('day'),
    endTime: toMoment(r.endDate).endOf('day'),
  };
}

export function toDateRangeName(x: TypedDateRange): string {
  switch (x.type) {
    case 'month':
      return toMonthName(x.start);
    case 'year':
      return toYearName(x.start);
    case 'custom':
      return (
        toMoment(x.start).format(displayDatePattern) +
        ' - ' +
        toMoment(x.end).format(displayDatePattern)
      );
    default:
      return '?';
  }
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

export function toDateRange(start: DateLike, end: DateLike): TypedDateRange {
  const s = toMoment(start);
  if (s.isSame(end, 'month')) return monthRange(s);
  if (s.isSame(end, 'year')) return yearRange(s);
  return { type: 'custom', start: s.toDate(), end: toMoment(end).toDate() };
}

const yearRE = /[0-9]{4}/;

function fromYearValue(y: DateLike): Moment | undefined {
  if (typeof y === 'number' || (typeof y === 'string' && yearRE.test(y))) {
    const year = parseInt(y, 10);
    return toMoment(`${leftPad(year, 4, '0')}-01-01`);
  }
  return;
}

export function compareRanges(a: UIDateRange, b: UIDateRange) {
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
