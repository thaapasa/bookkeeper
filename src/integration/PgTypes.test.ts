import { describe, expect, it } from 'bun:test';

import { ISODateRegExp, ISOTimestampRegExp } from 'shared/time';

import { db } from '../server/data/Db';

describe('pg type parsers', () => {
  it('should return DATE columns as ISODate strings', async () => {
    const result = await db.one<{ d: unknown }>(`SELECT '2026-03-31'::DATE AS d`);
    expect(typeof result.d).toBe('string');
    expect(result.d).toBe('2026-03-31');
    expect(ISODateRegExp.test(result.d as string)).toBe(true);
  });

  it('should return TIMESTAMPTZ columns as ISOTimestamp strings', async () => {
    const result = await db.one<{ ts: unknown }>(
      `SELECT '2026-03-31 12:00:00+02'::TIMESTAMPTZ AS ts`,
    );
    expect(typeof result.ts).toBe('string');
    expect(result.ts).not.toBeInstanceOf(Date);
    expect(ISOTimestampRegExp.test(result.ts as string)).toBe(true);
  });

  it('should reject TIMESTAMP without timezone', async () => {
    expect(db.one(`SELECT '2026-03-31 12:00:00'::TIMESTAMP AS ts`)).rejects.toThrow(
      'TIMESTAMP without timezone',
    );
  });

  it('should round-trip ISODate through a temp table DATE column', async () => {
    await db.tx(async tx => {
      await tx.none(`CREATE TEMP TABLE _test_dates (d DATE NOT NULL) ON COMMIT DROP`);
      await tx.none(`INSERT INTO _test_dates (d) VALUES ($/d/)`, { d: '2026-01-15' });
      const row = await tx.one<{ d: unknown }>(`SELECT d FROM _test_dates`);
      expect(row.d).toBe('2026-01-15');
      expect(typeof row.d).toBe('string');
    });
  });

  it('should round-trip TIMESTAMPTZ through a temp table as ISOTimestamp', async () => {
    await db.tx(async tx => {
      await tx.none(`CREATE TEMP TABLE _test_timestamps (ts TIMESTAMPTZ NOT NULL) ON COMMIT DROP`);
      await tx.none(`INSERT INTO _test_timestamps (ts) VALUES ($/ts/)`, {
        ts: '2026-03-31T12:00:00+02:00',
      });
      const row = await tx.one<{ ts: unknown }>(`SELECT ts FROM _test_timestamps`);
      expect(typeof row.ts).toBe('string');
      expect(row.ts).not.toBeInstanceOf(Date);
      expect(ISOTimestampRegExp.test(row.ts as string)).toBe(true);
    });
  });

  it('should preserve expense date as ISODate when reading from expenses table', async () => {
    const row = await db.oneOrNone<{ date: unknown }>(`SELECT date FROM expenses LIMIT 1`);
    if (row) {
      expect(typeof row.date).toBe('string');
      expect(ISODateRegExp.test(row.date as string)).toBe(true);
    }
  });

  it('should return expense created as ISOTimestamp from expenses table', async () => {
    const row = await db.oneOrNone<{ created: unknown }>(`SELECT created FROM expenses LIMIT 1`);
    if (row) {
      expect(typeof row.created).toBe('string');
      expect(row.created).not.toBeInstanceOf(Date);
      expect(ISOTimestampRegExp.test(row.created as string)).toBe(true);
    }
  });
});
