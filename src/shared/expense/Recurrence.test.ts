import 'jest';

import { MoneyLike } from '../util/Money';
import {
  RecurrencePeriod,
  recurrencePerMonth,
  recurrencePerYear,
  RecurrenceUnit,
} from './Recurrence';

function r(amount: number, unit: RecurrenceUnit): RecurrencePeriod {
  return { amount, unit };
}

describe('recurrence', () => {
  it.each<[MoneyLike, RecurrencePeriod, MoneyLike]>([
    ['100', r(1, 'months'), '100.00'],
    ['100', r(2, 'months'), '50.00'],
    ['100', r(3, 'months'), '33.33'],
    ['50', r(2, 'months'), '25.00'],
    ['100', r(1, 'years'), '8.33'],
    ['100', r(2, 'years'), '4.16'],
    ['100', r(1, 'quarters'), '33.33'],
    ['30', r(1, 'quarters'), '10.00'],
    ['100', r(1, 'weeks'), '434.82'],
    ['100', r(2, 'weeks'), '217.41'],
    ['100', r(1, 'days'), '3043.75'],
    ['1', r(1, 'days'), '30.43'],
  ])(
    'Calculates monthly recurrence of %s in %s = %s',
    (sum, period, amount) => {
      expect(recurrencePerMonth(sum, period).toString()).toBe(amount);
    }
  );

  it.each<[MoneyLike, RecurrencePeriod, MoneyLike]>([
    ['100', r(1, 'months'), '1200.00'],
    ['100', r(2, 'months'), '600.00'],
    ['100', r(3, 'months'), '400.00'],
    ['50', r(2, 'months'), '300.00'],
    ['100', r(1, 'years'), '100.00'],
    ['100', r(2, 'years'), '50.00'],
    ['100', r(1, 'quarters'), '400.00'],
    ['30', r(1, 'quarters'), '120.00'],
    ['1', r(1, 'weeks'), '52.17'],
    ['1', r(2, 'weeks'), '26.08'],
    ['1', r(1, 'days'), '365.25'],
    ['1', r(2, 'days'), '182.62'],
  ])('Calculates yearly recurrence of %s in %s = %s', (sum, period, amount) => {
    expect(recurrencePerYear(sum, period).toString()).toBe(amount);
  });
});
