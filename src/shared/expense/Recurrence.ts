import Big from 'big.js';
import { z } from 'zod';

import { Money, MoneyLike } from 'shared/util';

export const RecurrenceUnit = z.enum([
  'days',
  'weeks',
  'months',
  'years',
  'quarters',
]);
export type RecurrenceUnit = z.infer<typeof RecurrenceUnit>;

export const RecurrencePeriod = z.object({
  amount: z.number().int().min(1),
  unit: RecurrenceUnit,
});
export type RecurrencePeriod = z.infer<typeof RecurrencePeriod>;

const avgDaysInYear = 365.25;
const avgWeeksInYear = avgDaysInYear / 7;
const avgDaysInMonth = avgDaysInYear / 12;
const avgWeeksInMonth = avgDaysInMonth / 7;

const yearlyMultipliers: Record<RecurrenceUnit, number> = {
  years: 1,
  months: 12,
  days: avgDaysInYear,
  weeks: avgWeeksInYear,
  quarters: 4,
};

const monthlyMultipliers: Record<RecurrenceUnit, number> = {
  years: 1.0 / 12.0,
  months: 1,
  days: avgDaysInMonth,
  weeks: avgWeeksInMonth,
  quarters: 1.0 / 2.9999999,
};

export function recurrencePerMonth(
  sum: MoneyLike,
  period: RecurrencePeriod
): Money {
  const money = Money.from(sum);
  return money
    .multiply(monthlyMultipliers[period.unit])
    .divide(period.amount)
    .round(2, Big.roundHalfUp);
}

export function recurrencePerYear(
  sum: MoneyLike,
  period: RecurrencePeriod
): Money {
  const money = Money.from(sum);
  return money.multiply(yearlyMultipliers[period.unit]).divide(period.amount);
}
