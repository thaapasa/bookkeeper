import { describe, expect, it } from 'bun:test';

import { toISODate } from '../time/Time';
import { statementDateRange } from './Statement';

const row = (bookingDate: string) => ({ bookingDate: toISODate(bookingDate) });

describe('statementDateRange', () => {
  it('returns undefined for an empty file', () => {
    expect(statementDateRange([])).toBeUndefined();
  });

  it('returns the single date as both ends for one row', () => {
    expect(statementDateRange([row('2026-05-03')])).toEqual({
      start: toISODate('2026-05-03'),
      end: toISODate('2026-05-03'),
    });
  });

  it('finds min and max booking dates regardless of row order', () => {
    const rows = [row('2026-05-03'), row('2026-04-28'), row('2026-05-10'), row('2026-05-01')];
    expect(statementDateRange(rows)).toEqual({
      start: toISODate('2026-04-28'),
      end: toISODate('2026-05-10'),
    });
  });

  it('orders dates across year boundaries', () => {
    const rows = [row('2026-01-02'), row('2025-12-30')];
    expect(statementDateRange(rows)).toEqual({
      start: toISODate('2025-12-30'),
      end: toISODate('2026-01-02'),
    });
  });
});
