import { describe, expect, it } from 'bun:test';

import { dateTimeFromParts, ISODate, ISOMonth } from './Time';
import {
  compareRanges,
  dateRangeToDateTimeRange,
  getMonthsInRange,
  getYearsInRange,
  monthRange,
  toDateRange,
  toDateRangeName,
  yearRange,
} from './TimeRange';

describe('time ranges', () => {
  describe('toDateRangeName', () => {
    it('should format month name', () => {
      expect(toDateRangeName(monthRange(dateTimeFromParts(2017, 4, 1)))).toEqual('Huhtikuu 2017');
      expect(toDateRangeName(monthRange(dateTimeFromParts(2025, 12, 1)))).toEqual('Joulukuu 2025');
    });

    it('should format year name', () => {
      expect(toDateRangeName(yearRange(dateTimeFromParts(2017, 4, 1)))).toEqual('2017');
      expect(toDateRangeName(yearRange(dateTimeFromParts(2025, 12, 1)))).toEqual('2025');
    });

    it('should format custom range', () => {
      const name = toDateRangeName({
        type: 'custom',
        start: '2026-01-15' as ISODate,
        end: '2026-06-30' as ISODate,
      });
      expect(name).toBe('15.1.2026 - 30.6.2026');
    });
  });

  describe('yearRange', () => {
    it('creates range for full year from date string', () => {
      const range = yearRange('2026-06-15');
      expect(range.type).toBe('year');
      expect(range.start).toBe('2026-01-01');
      expect(range.end).toBe('2026-12-31');
    });

    it('creates range from year string', () => {
      const range = yearRange('2026');
      expect(range.type).toBe('year');
      expect(range.start).toBe('2026-01-01');
      expect(range.end).toBe('2026-12-31');
    });
  });

  describe('monthRange', () => {
    it('creates range for full month', () => {
      const range = monthRange('2026-03-15');
      expect(range.type).toBe('month');
      expect(range.start).toBe('2026-03-01');
      expect(range.end).toBe('2026-03-31');
    });

    it('handles February in leap year', () => {
      const range = monthRange('2024-02-10');
      expect(range.start).toBe('2024-02-01');
      expect(range.end).toBe('2024-02-29');
    });

    it('handles February in non-leap year', () => {
      const range = monthRange('2026-02-10');
      expect(range.start).toBe('2026-02-01');
      expect(range.end).toBe('2026-02-28');
    });
  });

  describe('toDateRange', () => {
    it('detects month range', () => {
      const range = toDateRange('2026-03-01', '2026-03-31');
      expect(range.type).toBe('month');
    });

    it('detects year range', () => {
      const range = toDateRange('2026-01-01', '2026-12-31');
      expect(range.type).toBe('year');
    });

    it('creates custom range for cross-year spans', () => {
      const range = toDateRange('2025-06-15', '2026-06-30');
      expect(range.type).toBe('custom');
      expect(range.start).toBe('2025-06-15');
      expect(range.end).toBe('2026-06-30');
    });
  });

  describe('getYearsInRange', () => {
    it('returns single year', () => {
      expect(getYearsInRange({ startDate: '2026-03-01', endDate: '2026-12-31' })).toEqual([2026]);
    });

    it('returns multiple years', () => {
      expect(getYearsInRange({ startDate: '2024-06-01', endDate: '2026-03-31' })).toEqual([
        2024, 2025, 2026,
      ]);
    });
  });

  describe('getMonthsInRange', () => {
    it('returns months within a single year', () => {
      const months = getMonthsInRange({ startDate: '2026-03-01', endDate: '2026-06-30' });
      expect(months).toEqual(['2026-03', '2026-04', '2026-05', '2026-06'] as ISOMonth[]);
    });

    it('returns months spanning years', () => {
      const months = getMonthsInRange({ startDate: '2025-11-01', endDate: '2026-02-28' });
      expect(months).toEqual(['2025-11', '2025-12', '2026-01', '2026-02'] as ISOMonth[]);
    });

    it('returns empty for empty range', () => {
      expect(getMonthsInRange({ startDate: '2027-01-01', endDate: '2026-01-01' })).toEqual([]);
    });
  });

  describe('dateRangeToDateTimeRange', () => {
    it('converts DateRange to DateTimeRange', () => {
      const range = dateRangeToDateTimeRange({ startDate: '2026-03-01', endDate: '2026-03-31' });
      expect(range.startTime.year).toBe(2026);
      expect(range.startTime.month).toBe(3);
      expect(range.startTime.day).toBe(1);
      expect(range.endTime.day).toBe(31);
    });
  });

  describe('compareRanges', () => {
    it('returns 0 for identical ranges', () => {
      const a = { start: '2026-01-01' as ISODate, end: '2026-12-31' as ISODate };
      expect(compareRanges(a, a)).toBe(0);
    });

    it('returns -1 when first starts earlier', () => {
      const a = { start: '2025-01-01' as ISODate, end: '2025-12-31' as ISODate };
      const b = { start: '2026-01-01' as ISODate, end: '2026-12-31' as ISODate };
      expect(compareRanges(a, b)).toBe(-1);
    });

    it('returns 1 when first starts later', () => {
      const a = { start: '2026-01-01' as ISODate, end: '2026-12-31' as ISODate };
      const b = { start: '2025-01-01' as ISODate, end: '2025-12-31' as ISODate };
      expect(compareRanges(a, b)).toBe(1);
    });

    it('compares by end date when starts are equal', () => {
      const a = { start: '2026-01-01' as ISODate, end: '2026-06-30' as ISODate };
      const b = { start: '2026-01-01' as ISODate, end: '2026-12-31' as ISODate };
      expect(compareRanges(a, b)).toBe(-1);
    });
  });
});
