import * as io from 'io-ts';
import { Moment } from 'moment';
import { z } from 'zod';

import {
  compareDates,
  DateLike,
  displayDatePattern,
  ISODate,
  ISODateZ,
  toMoment,
  toMonthName,
  toYearName,
} from './Time';
import { leftPad } from './Util';

export const DateRange = io.type({
  startDate: ISODate,
  endDate: ISODate,
});
export const DateRangeZ = z.object({ startDate: ISODateZ, endDate: ISODateZ });
export type DateRange = io.TypeOf<typeof DateRange>;

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
    return toMoment(leftPad(year, 4, '0') + '-01-01');
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
