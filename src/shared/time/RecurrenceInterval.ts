import { DurationUnit } from 'luxon';
import { z } from 'zod';

const unitValues = ['year', 'years', 'month', 'months', 'week', 'weeks', 'day', 'days'] satisfies [
  DurationUnit,
  ...DurationUnit[],
];

export const RecurrenceIntervalUnit = z.enum(unitValues);
export type RecurrenceIntervalUnit = z.infer<typeof RecurrenceIntervalUnit>;

export const RecurrenceInterval = z.object({
  amount: z.number(),
  unit: RecurrenceIntervalUnit,
});
export type RecurrenceInterval = z.infer<typeof RecurrenceInterval>;

const canonicalUnits: Record<RecurrenceIntervalUnit, RecurrenceIntervalUnit> = {
  year: 'year',
  years: 'year',
  month: 'month',
  months: 'month',
  week: 'week',
  weeks: 'week',
  day: 'day',
  days: 'day',
};

export function isSameInterval(a?: RecurrenceInterval, b?: RecurrenceInterval) {
  if (!a || !b) return false;
  return canonicalUnits[a.unit] === canonicalUnits[b.unit] && a.amount === b.amount;
}
