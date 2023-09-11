import { z } from 'zod';

import { toMoment } from './Moment';
import { Month, toISODate, Year } from './Time';
import { DateRange } from './TimeRange';

export const YearPeriod = z.object({
  type: z.literal('year'),
  year: Year,
});
export type YearPeriod = z.infer<typeof YearPeriod>;

export const MonthPeriod = z.object({
  type: z.literal('month'),
  year: Year,
  month: Month,
});
export type MonthPeriod = z.infer<typeof MonthPeriod>;

export const NowPeriod = z.object({
  type: z.literal('now'),
});
export type NowPeriod = z.infer<typeof NowPeriod>;

export const AllPeriod = z.object({
  type: z.literal('all'),
});
export type AllPeriod = z.infer<typeof AllPeriod>;

export const Period = z.union([YearPeriod, MonthPeriod, NowPeriod, AllPeriod]);
export type Period = z.infer<typeof Period>;

export type PeriodType = Period['type'];
export const AllPeriods: PeriodType[] = ['all', 'now', 'year', 'month'];

export function periodToYearAndMonth(p: Period): [Year, Month] {
  switch (p.type) {
    case 'month':
      return [p.year, p.month];
    case 'year':
      return [p.year, 1];
    default: {
      const m = toMoment();
      return [m.year(), m.month() + 1];
    }
  }
}

export function periodsToDateRange(start: Period, end: Period): DateRange {
  return { startDate: toDateAtStart(start), endDate: toDateAtEnd(end) };
}

const pastDate = '2000-01-01';

function toDateAtStart(p: Period) {
  switch (p.type) {
    case 'all':
      return pastDate;
    case 'year':
      return toISODate(toMoment(p.year, 'YYYY').startOf('year'));
    case 'month':
      return toISODate(toMoment(`${p.year}-${p.month}`, 'YYYY-MM').startOf('month'));
    default:
      return toISODate();
  }
}

function toDateAtEnd(p: Period) {
  switch (p.type) {
    case 'year':
      return toISODate(toMoment(p.year, 'YYYY').endOf('year'));
    case 'month':
      return toISODate(toMoment(`${p.year}-${p.month}`, 'YYYY-MM').endOf('month'));
    default:
      return toISODate();
  }
}
