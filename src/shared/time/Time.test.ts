import { describe, expect, it } from 'bun:test';
import { DateTime } from 'luxon';

import {
  compareDates,
  dateTimeFromParts,
  ISODate,
  ISODateRegExp,
  ISOMonth,
  ISOMonthRegExp,
  ISOTimestamp,
  ISOTimestampRegExp,
  ISOYear,
  ISOYearRegExp,
  monthToYear,
  readableDate,
  readableDateWithYear,
  toDateTime,
  toISODate,
  toISOTimestamp,
  toYearName,
} from './Time';

describe('branded types', () => {
  describe('ISODate', () => {
    it.each([['2026-03-31'], ['2000-01-01'], ['1999-12-31']])('accepts valid date %s', d => {
      expect(ISODate.safeParse(d)).toMatchObject({ success: true, data: d });
    });

    it.each([['2026-3-31'], ['2026-03-1'], ['20260331'], ['2026/03/31'], ['abc'], [''], [123]])(
      'rejects invalid date %s',
      d => {
        expect(ISODate.safeParse(d)).toMatchObject({ success: false });
      },
    );
  });

  describe('ISOMonth', () => {
    it.each([['2026-03'], ['2000-01'], ['1999-12']])('accepts valid month %s', m => {
      expect(ISOMonth.safeParse(m)).toMatchObject({ success: true, data: m });
    });

    it.each([['2026-3'], ['202603'], ['2026/03'], ['abc'], [''], [42]])(
      'rejects invalid month %s',
      m => {
        expect(ISOMonth.safeParse(m)).toMatchObject({ success: false });
      },
    );
  });

  describe('ISOYear', () => {
    it.each([['2026'], ['2000'], ['1999']])('accepts valid year %s', y => {
      expect(ISOYear.safeParse(y)).toMatchObject({ success: true, data: y });
    });

    it.each([['202'], ['20260'], ['abcd'], [''], [2026]])('rejects invalid year %s', y => {
      expect(ISOYear.safeParse(y)).toMatchObject({ success: false });
    });
  });

  describe('ISOTimestamp', () => {
    it.each([
      ['2026-03-31T12:00:00Z'],
      ['2026-03-31T12:00:00+02:00'],
      ['2026-03-31T12:00:00-05:00'],
      ['2026-03-31T12:00:00.000Z'],
      ['2026-03-31T12:00:00.123+03:00'],
    ])('accepts valid timestamp %s', ts => {
      expect(ISOTimestamp.safeParse(ts)).toMatchObject({ success: true, data: ts });
    });

    it.each([
      ['2026-03-31T12:00:00'],
      ['2026-03-31 12:00:00+02'],
      ['2026-03-31'],
      ['abc'],
      [''],
      [123],
    ])('rejects invalid timestamp %s', ts => {
      expect(ISOTimestamp.safeParse(ts)).toMatchObject({ success: false });
    });
  });

  describe('regexps', () => {
    it('ISODateRegExp matches dates', () => {
      expect(ISODateRegExp.test('2026-03-31')).toBe(true);
      expect(ISODateRegExp.test('not-a-date')).toBe(false);
    });

    it('ISOMonthRegExp matches months', () => {
      expect(ISOMonthRegExp.test('2026-03')).toBe(true);
      expect(ISOMonthRegExp.test('2026-3')).toBe(false);
    });

    it('ISOYearRegExp matches years', () => {
      expect(ISOYearRegExp.test('2026')).toBe(true);
      expect(ISOYearRegExp.test('202')).toBe(false);
      expect(ISOYearRegExp.test('20260')).toBe(false);
    });

    it('ISOTimestampRegExp matches timestamps with timezone', () => {
      expect(ISOTimestampRegExp.test('2026-03-31T12:00:00Z')).toBe(true);
      expect(ISOTimestampRegExp.test('2026-03-31T12:00:00+02:00')).toBe(true);
      expect(ISOTimestampRegExp.test('2026-03-31T12:00:00')).toBe(false);
    });
  });
});

describe('toDateTime', () => {
  it('returns DateTime.now() for undefined', () => {
    const result = toDateTime();
    expect(result.isValid).toBe(true);
    expect(result.year).toBe(DateTime.now().year);
  });

  it('returns DateTime.now() for null', () => {
    const result = toDateTime(null);
    expect(result.isValid).toBe(true);
  });

  it('passes through DateTime values', () => {
    const dt = DateTime.fromISO('2026-03-31');
    expect(toDateTime(dt)).toBe(dt);
  });

  it('parses ISO date strings', () => {
    const result = toDateTime('2026-03-31');
    expect(result.year).toBe(2026);
    expect(result.month).toBe(3);
    expect(result.day).toBe(31);
  });

  it('parses ISO timestamp strings', () => {
    const result = toDateTime('2026-03-31T12:00:00+02:00');
    expect(result.year).toBe(2026);
    expect(result.month).toBe(3);
    expect(result.day).toBe(31);
  });

  it('parses SQL format strings', () => {
    const result = toDateTime('2026-03-31 12:00:00+02');
    expect(result.isValid).toBe(true);
    expect(result.year).toBe(2026);
  });

  it('handles JS Date objects at runtime', () => {
    const jsDate = new Date(2026, 2, 31);
    const result = toDateTime(jsDate as unknown as string);
    expect(result.year).toBe(2026);
    expect(result.month).toBe(3);
    expect(result.day).toBe(31);
  });
});

describe('dateTimeFromParts', () => {
  it('creates DateTime from numeric parts', () => {
    const result = dateTimeFromParts(2026, 3, 31);
    expect(result.year).toBe(2026);
    expect(result.month).toBe(3);
    expect(result.day).toBe(31);
  });

  it('creates DateTime from string parts', () => {
    const result = dateTimeFromParts('2026', '03', '15');
    expect(result.year).toBe(2026);
    expect(result.month).toBe(3);
    expect(result.day).toBe(15);
  });

  it('pads single-digit values', () => {
    const result = dateTimeFromParts(2026, 1, 5);
    expect(result.isValid).toBe(true);
    expect(result.month).toBe(1);
    expect(result.day).toBe(5);
  });
});

describe('toISODate', () => {
  it('converts DateTime to ISODate', () => {
    expect(toISODate(DateTime.fromISO('2026-03-31'))).toBe('2026-03-31');
  });

  it('converts string to ISODate', () => {
    expect(toISODate('2026-03-31')).toBe('2026-03-31');
  });

  it('returns today for undefined', () => {
    const result = toISODate();
    expect(ISODateRegExp.test(result)).toBe(true);
  });
});

describe('toISOTimestamp', () => {
  it('converts DateTime to ISOTimestamp', () => {
    const result = toISOTimestamp(DateTime.fromISO('2026-03-31T12:00:00+02:00'));
    expect(ISOTimestampRegExp.test(result)).toBe(true);
    expect(result).toContain('2026-03-31');
  });

  it('converts string to ISOTimestamp', () => {
    const result = toISOTimestamp('2026-03-31T12:00:00Z');
    expect(ISOTimestampRegExp.test(result)).toBe(true);
  });

  it('returns current timestamp for undefined', () => {
    const result = toISOTimestamp();
    expect(ISOTimestampRegExp.test(result)).toBe(true);
  });
});

describe('readableDate', () => {
  it('formats date in short Finnish format', () => {
    expect(readableDate('2026-03-31')).toBe('31.3.');
  });

  it('formats date in long Finnish format', () => {
    expect(readableDate('2026-03-31', true)).toMatch(/\w+ 31\.3\./);
  });

  it('returns dash for undefined', () => {
    expect(readableDate()).toBe('-');
  });
});

describe('readableDateWithYear', () => {
  it('formats date with year in short format', () => {
    expect(readableDateWithYear('2026-03-31')).toBe('31.3.2026');
  });

  it('formats date with year in long format', () => {
    expect(readableDateWithYear('2026-03-31', true)).toMatch(/\w+ 31\.3\.2026/);
  });

  it('returns dash for undefined', () => {
    expect(readableDateWithYear()).toBe('-');
  });
});

describe('toYearName', () => {
  it('extracts year as string', () => {
    expect(toYearName('2026-03-31')).toBe('2026');
  });

  it('works with DateTime', () => {
    expect(toYearName(DateTime.fromISO('2017-06-15'))).toBe('2017');
  });
});

describe('compareDates', () => {
  it('returns 0 for equal dates', () => {
    expect(compareDates('2026-03-31', '2026-03-31')).toBe(0);
  });

  it('returns -1 when first is earlier', () => {
    expect(compareDates('2026-03-30', '2026-03-31')).toBe(-1);
  });

  it('returns 1 when first is later', () => {
    expect(compareDates('2026-04-01', '2026-03-31')).toBe(1);
  });

  it('returns 0 for both undefined', () => {
    expect(compareDates(undefined, undefined)).toBe(0);
  });

  it('returns -1 when first is undefined', () => {
    expect(compareDates(undefined, '2026-03-31')).toBe(-1);
  });

  it('returns 1 when second is undefined', () => {
    expect(compareDates('2026-03-31', undefined)).toBe(1);
  });
});

describe('monthToYear', () => {
  it('extracts year from ISOMonth', () => {
    expect(monthToYear('2026-03' as ISOMonth)).toBe(2026);
  });

  it('extracts year from ISODate', () => {
    expect(monthToYear('2017-12-31' as ISODate)).toBe(2017);
  });
});
