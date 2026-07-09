import { DateTime } from 'luxon';

import { BkError, CurrencyRates } from 'shared/types';
import { logger } from 'server/Logger';

const ECB_DAILY_RATES_URL = 'https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml';

/**
 * The ECB publishes once per working day, around 16:00 CET. Refreshing every four hours
 * picks that up on the same day without polling a static file pointlessly often.
 */
const CACHE_TTL_MINUTES = 4 * 60;

const REQUEST_TIMEOUT_MS = 10_000;

/** `<Cube currency='USD' rate='1.1435'/>` */
const RATE_PATTERN = /<Cube\s+currency=['"]([A-Z]{3})['"]\s+rate=['"]([0-9]*\.?[0-9]+)['"]\s*\/>/g;
/** `<Cube time='2026-07-09'>` */
const DATE_PATTERN = /<Cube\s+time=['"](\d{4}-\d{2}-\d{2})['"]/;

interface RateCache {
  fetchedAt: DateTime;
  rates: CurrencyRates;
}

let cache: RateCache | undefined;

/**
 * Parses the ECB daily reference rate feed. The feed is machine-generated with a fixed,
 * flat shape, so a targeted regex beats pulling in an XML parser — but the result is Zod
 * validated so a shape change fails loudly instead of yielding an empty rate set.
 */
export function parseEcbRates(xml: string): CurrencyRates {
  const dateMatch = DATE_PATTERN.exec(xml);
  if (!dateMatch) {
    throw new BkError('CURRENCY_RATES_INVALID', 'ECB feed has no rate date', 502);
  }
  const rates: Record<string, string> = {};
  for (const [, code, rate] of xml.matchAll(RATE_PATTERN)) {
    rates[code] = rate;
  }
  if (Object.keys(rates).length === 0) {
    throw new BkError('CURRENCY_RATES_INVALID', 'ECB feed contains no rates', 502);
  }
  return CurrencyRates.parse({ date: dateMatch[1], base: 'EUR', rates });
}

async function fetchEcbRates(): Promise<CurrencyRates> {
  const res = await fetch(ECB_DAILY_RATES_URL, {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!res.ok) {
    throw new BkError('CURRENCY_RATES_UNAVAILABLE', `ECB responded with ${res.status}`, 502);
  }
  return parseEcbRates(await res.text());
}

function isFresh(entry: RateCache): boolean {
  return DateTime.now().diff(entry.fetchedAt, 'minutes').minutes < CACHE_TTL_MINUTES;
}

/**
 * Rates for every currency the ECB publishes, as units per 1 EUR.
 *
 * A stale cache is served when the refetch fails: an out-of-date rate is far more useful
 * than none, since the conversion is only ever an estimate. Only a cold cache is an error.
 */
export async function getCurrencyRates(): Promise<CurrencyRates> {
  if (cache && isFresh(cache)) {
    return cache.rates;
  }
  try {
    const rates = await fetchEcbRates();
    cache = { fetchedAt: DateTime.now(), rates };
    logger.info({ date: rates.date, count: Object.keys(rates.rates).length }, 'Fetched ECB rates');
    return rates;
  } catch (error) {
    if (cache) {
      logger.warn({ error }, 'Failed to refresh ECB rates, serving stale cache');
      return cache.rates;
    }
    logger.error({ error }, 'Failed to fetch ECB rates, no cached rates available');
    throw new BkError('CURRENCY_RATES_UNAVAILABLE', 'Currency rates are not available', 503);
  }
}
