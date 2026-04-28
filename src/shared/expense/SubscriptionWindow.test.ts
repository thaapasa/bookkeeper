import { describe, expect, it } from 'bun:test';
import { DateTime } from 'luxon';

import { baselineWindow } from './SubscriptionWindow';

describe('baselineWindow', () => {
  it('caps endDate at end-of-current-month', () => {
    // Mid-month "now" → end-of-month is month-end of the same month.
    const w = baselineWindow({ amount: 1, unit: 'years' }, DateTime.fromISO('2026-04-15'));
    expect(w.endDate).toBe('2026-04-30');
  });

  it('caps endDate at end-of-current-month even if "now" is the last day', () => {
    // Edge: invoking on the final day of the month must not roll into
    // next month. Luxon's endOf('month') is idempotent here.
    const w = baselineWindow({ amount: 1, unit: 'years' }, DateTime.fromISO('2026-04-30'));
    expect(w.endDate).toBe('2026-04-30');
  });

  it('handles February leap-year end-of-month correctly', () => {
    const w = baselineWindow({ amount: 1, unit: 'years' }, DateTime.fromISO('2024-02-15'));
    expect(w.endDate).toBe('2024-02-29');
    // 12 months trailing: 2023-03-01 .. 2024-02-29.
    expect(w.startDate).toBe('2023-03-01');
    expect(w.months).toBe(12);
  });

  it('1 year = exactly 12 calendar months trailing the current month', () => {
    // Anchored to end-of-current-month; "now" at any day in April 2026
    // produces the same window.
    const w = baselineWindow({ amount: 1, unit: 'years' }, DateTime.fromISO('2026-04-15'));
    expect(w.startDate).toBe('2025-05-01');
    expect(w.endDate).toBe('2026-04-30');
    expect(w.months).toBe(12);
  });

  it('3 years = exactly 36 calendar months', () => {
    const w = baselineWindow({ amount: 3, unit: 'years' }, DateTime.fromISO('2026-04-15'));
    expect(w.startDate).toBe('2023-05-01');
    expect(w.endDate).toBe('2026-04-30');
    expect(w.months).toBe(36);
  });

  it('5 years = exactly 60 calendar months', () => {
    const w = baselineWindow({ amount: 5, unit: 'years' }, DateTime.fromISO('2026-04-15'));
    expect(w.startDate).toBe('2021-05-01');
    expect(w.endDate).toBe('2026-04-30');
    expect(w.months).toBe(60);
  });

  it('default range is 5 years', () => {
    const w = baselineWindow(undefined, DateTime.fromISO('2026-04-15'));
    expect(w.startDate).toBe('2021-05-01');
    expect(w.endDate).toBe('2026-04-30');
    expect(w.months).toBe(60);
  });

  it('months unit produces the trailing N calendar months', () => {
    // 6 months ending in April 2026 → Nov 2025 .. Apr 2026 (6 months).
    const w = baselineWindow({ amount: 6, unit: 'months' }, DateTime.fromISO('2026-04-15'));
    expect(w.startDate).toBe('2025-11-01');
    expect(w.endDate).toBe('2026-04-30');
    expect(w.months).toBe(6);
  });

  it('start day is always the first of a month, regardless of "now" day', () => {
    // The day-of-month of "now" must not leak into startDate — only
    // the month matters, because endDate snaps to end-of-month.
    const days = ['01', '07', '15', '28'];
    for (const day of days) {
      const w = baselineWindow({ amount: 1, unit: 'years' }, DateTime.fromISO(`2026-04-${day}`));
      expect(w.startDate).toBe('2025-05-01');
      expect(w.endDate).toBe('2026-04-30');
    }
  });
});
