import { describe, expect, it } from 'bun:test';

import { getFinnishMonthName, isSameMonth, toMonthName } from './Months';

describe('getFinnishMonthName', () => {
  it.each([
    [1, 'Tammikuu'],
    [6, 'Kesäkuu'],
    [12, 'Joulukuu'],
  ])('returns correct name for month number %d', (month, name) => {
    expect(getFinnishMonthName(month)).toBe(name);
  });

  it('returns correct name for string number', () => {
    expect(getFinnishMonthName('3')).toBe('Maaliskuu');
  });

  it('returns correct name from date string', () => {
    expect(getFinnishMonthName('2026-07-15')).toBe('Heinäkuu');
  });
});

describe('toMonthName', () => {
  it('formats month name with year', () => {
    expect(toMonthName('2026-03-15')).toBe('Maaliskuu 2026');
  });

  it('works with ISOMonth string', () => {
    expect(toMonthName('2017-12-01')).toBe('Joulukuu 2017');
  });
});

describe('isSameMonth', () => {
  it('returns true for same month', () => {
    expect(isSameMonth('2026-03-01', '2026-03-31')).toBe(true);
  });

  it('returns false for different months', () => {
    expect(isSameMonth('2026-03-31', '2026-04-01')).toBe(false);
  });

  it('returns false for same month in different years', () => {
    expect(isSameMonth('2025-03-15', '2026-03-15')).toBe(false);
  });
});
