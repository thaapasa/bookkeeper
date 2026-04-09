import { describe, expect, it } from 'bun:test';

import { isSameInterval, RecurrenceInterval } from './RecurrenceInterval';

describe('RecurrenceInterval', () => {
  describe('Zod schema', () => {
    it('accepts valid intervals', () => {
      expect(RecurrenceInterval.parse({ amount: 1, unit: 'year' })).toEqual({
        amount: 1,
        unit: 'year',
      });
      expect(RecurrenceInterval.parse({ amount: 3, unit: 'months' })).toEqual({
        amount: 3,
        unit: 'months',
      });
    });

    it('rejects invalid units', () => {
      expect(RecurrenceInterval.safeParse({ amount: 1, unit: 'century' })).toMatchObject({
        success: false,
      });
    });

    it('rejects missing fields', () => {
      expect(RecurrenceInterval.safeParse({ amount: 1 })).toMatchObject({ success: false });
      expect(RecurrenceInterval.safeParse({ unit: 'year' })).toMatchObject({ success: false });
    });
  });

  describe('isSameInterval', () => {
    it('returns true for identical intervals', () => {
      expect(isSameInterval({ amount: 1, unit: 'year' }, { amount: 1, unit: 'year' })).toBe(true);
    });

    it('returns true for singular/plural equivalents', () => {
      expect(isSameInterval({ amount: 1, unit: 'year' }, { amount: 1, unit: 'years' })).toBe(true);
      expect(isSameInterval({ amount: 2, unit: 'month' }, { amount: 2, unit: 'months' })).toBe(
        true,
      );
      expect(isSameInterval({ amount: 1, unit: 'week' }, { amount: 1, unit: 'weeks' })).toBe(true);
      expect(isSameInterval({ amount: 7, unit: 'day' }, { amount: 7, unit: 'days' })).toBe(true);
    });

    it('returns false for different amounts', () => {
      expect(isSameInterval({ amount: 1, unit: 'year' }, { amount: 2, unit: 'year' })).toBe(false);
    });

    it('returns false for different units', () => {
      expect(isSameInterval({ amount: 1, unit: 'year' }, { amount: 1, unit: 'month' })).toBe(false);
    });

    it('returns false when either is undefined', () => {
      expect(isSameInterval(undefined, { amount: 1, unit: 'year' })).toBe(false);
      expect(isSameInterval({ amount: 1, unit: 'year' }, undefined)).toBe(false);
      expect(isSameInterval(undefined, undefined)).toBe(false);
    });
  });
});
