import { DateTime } from 'luxon';

import { ISODate, RecurrenceInterval, toDateTime, toISODate } from '../time';

export const defaultBaselineRange: RecurrenceInterval = { amount: 5, unit: 'years' };

export interface BaselineWindow {
  startDate: ISODate;
  endDate: ISODate;
  months: number;
}

/**
 * Compute the baseline window for subscription aggregation.
 *
 * - `endDate` is end-of-current-month so pre-generated future expenses
 *   don't inflate sums or per-month averages, and so a subscription
 *   already booked early in the current month still counts as a full
 *   month's worth.
 * - `startDate` is anchored to `endDate + 1 day - range`, which makes
 *   1y / 3y / 5y span exactly the trailing 12 / 36 / 60 calendar
 *   months (start-of-month-N to end-of-month-(N + range)).
 * - `months` is derived from the range directly (years × 12, months as
 *   given) so the per-month / per-year denominator is an exact integer
 *   for the year/month units the page exposes. Sub-month units (weeks,
 *   days) are accepted by the API schemas so they need a defined
 *   value too — those use a fractional 30-day approximation that's
 *   only ever observed by scripted callers.
 *
 * `now` is parameterized to keep the function pure and testable.
 */
export function baselineWindow(
  range: RecurrenceInterval = defaultBaselineRange,
  now: DateTime = toDateTime(),
): BaselineWindow {
  const endDate = now.endOf('month');
  const startDate = endDate.plus({ days: 1 }).minus({ [range.unit]: range.amount });
  return {
    startDate: toISODate(startDate),
    endDate: toISODate(endDate),
    months: rangeAsMonths(range),
  };
}

function rangeAsMonths(range: RecurrenceInterval): number {
  switch (range.unit) {
    case 'year':
    case 'years':
      return range.amount * 12;
    case 'month':
    case 'months':
      return range.amount;
    case 'week':
    case 'weeks':
      return (range.amount * 7) / 30;
    case 'day':
    case 'days':
      return range.amount / 30;
  }
}
