import { z } from 'zod';

import { Month, toMoment, Year } from './Time';

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
    default:
      const m = toMoment();
      return [m.year(), m.month() + 1];
  }
}
