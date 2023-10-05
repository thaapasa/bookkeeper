import { ManipulateType } from 'dayjs';
import { z } from 'zod';

type MomentUnit = ManipulateType;
const unitValues = ['year', 'years', 'month', 'months', 'week', 'weeks', 'day', 'days'] satisfies [
  MomentUnit,
  ...MomentUnit[],
];

export const MomentIntervalUnit = z.enum(unitValues);
export type MomentIntervalUnit = z.infer<typeof MomentIntervalUnit>;

export const MomentInterval = z.object({
  amount: z.number(),
  unit: MomentIntervalUnit,
});
export type MomentInterval = z.infer<typeof MomentInterval>;

const canonicalUnits: Record<MomentIntervalUnit, MomentIntervalUnit> = {
  year: 'year',
  years: 'year',
  month: 'month',
  months: 'months',
  week: 'week',
  weeks: 'week',
  day: 'day',
  days: 'day',
};

export function isSameInterval(a?: MomentInterval, b?: MomentInterval) {
  if (!a || !b) return false;
  return canonicalUnits[a.unit] === canonicalUnits[b.unit] && a.amount === b.amount;
}
