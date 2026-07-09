import { z } from 'zod';

import { ISODate } from '../time/Time';
import { DbObject, ShortString } from './Common';

/**
 * A foreign currency supported by this installation. EUR is never present here:
 * an expense without a currency is by definition in EUR.
 */
export const Currency = DbObject.extend({
  /** ISO 4217 code, e.g. `USD` */
  code: z.string().length(3),
  /** Symbol shown in the UI, e.g. `$` */
  symbol: ShortString,
  name: ShortString,
  /** ISO 3166-1 alpha-2 country code, used to render a flag */
  countryCode: z.string().length(2).or(z.null()),
});
export type Currency = z.infer<typeof Currency>;

/**
 * Rates are the number of currency units per 1 EUR, keyed by currency code.
 * Kept as strings: a rate needs more precision than `Money` (2 decimals) can carry.
 */
export const CurrencyRates = z.object({
  date: ISODate,
  base: z.literal('EUR'),
  rates: z.record(z.string(), z.string()),
});
export type CurrencyRates = z.infer<typeof CurrencyRates>;
