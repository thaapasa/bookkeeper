import { describe, expect, it } from 'bun:test';

import { periodsToDateRange, periodToYearAndMonth } from './Period';
import { ISODate } from './Time';

describe('periodToYearAndMonth', () => {
  it('returns year and month for month period', () => {
    expect(periodToYearAndMonth({ type: 'month', year: 2026, month: 3 })).toEqual([2026, 3]);
  });

  it('returns year and month 1 for year period', () => {
    expect(periodToYearAndMonth({ type: 'year', year: 2026 })).toEqual([2026, 1]);
  });

  it('returns current year and month for now period', () => {
    const [year, month] = periodToYearAndMonth({ type: 'now' });
    expect(year).toBeGreaterThan(2000);
    expect(month).toBeGreaterThanOrEqual(1);
    expect(month).toBeLessThanOrEqual(12);
  });

  it('returns current year and month for all period', () => {
    const [year, month] = periodToYearAndMonth({ type: 'all' });
    expect(year).toBeGreaterThan(2000);
    expect(month).toBeGreaterThanOrEqual(1);
  });
});

describe('periodsToDateRange', () => {
  it('creates range from year periods', () => {
    const range = periodsToDateRange({ type: 'year', year: 2026 }, { type: 'year', year: 2026 });
    expect(range.startDate).toBe('2026-01-01' as ISODate);
    expect(range.endDate).toBe('2026-12-31' as ISODate);
  });

  it('creates range from month periods', () => {
    const range = periodsToDateRange(
      { type: 'month', year: 2026, month: 3 },
      { type: 'month', year: 2026, month: 3 },
    );
    expect(range.startDate).toBe('2026-03-01' as ISODate);
    expect(range.endDate).toBe('2026-03-31' as ISODate);
  });

  it('creates range spanning months', () => {
    const range = periodsToDateRange(
      { type: 'month', year: 2026, month: 1 },
      { type: 'month', year: 2026, month: 6 },
    );
    expect(range.startDate).toBe('2026-01-01' as ISODate);
    expect(range.endDate).toBe('2026-06-30' as ISODate);
  });

  it('uses past date for all period start', () => {
    const range = periodsToDateRange({ type: 'all' }, { type: 'year', year: 2026 });
    expect(range.startDate).toBe('2000-01-01' as ISODate);
    expect(range.endDate).toBe('2026-12-31' as ISODate);
  });
});
