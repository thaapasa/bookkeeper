import { Big, RoundingMode } from 'big.js';

import { Money, MoneyLike } from './Money';

/** `RoundingMode` is a type-only export from `@types/big.js`; it has no runtime value */
const ROUND_HALF_UP: RoundingMode = 1;

/**
 * Currency conversion must not go through `Money`: `Money.ts` sets the *global*
 * `Big.DP = 2` and `Big.RM = 0` (truncate), which would both clamp an exchange rate
 * to two decimals and bias every conversion downwards by up to a cent.
 *
 * Calling `Big()` with no arguments returns a fresh, independent constructor whose
 * `DP`/`RM` are seeded from the library defaults rather than from the mutated
 * singleton, so configuring it here leaves all other money math untouched.
 */
const FxBig = Big();
FxBig.DP = 10;
FxBig.RM = ROUND_HALF_UP;

/** Both the foreign and the EUR amount are ordinary two-decimal monetary values */
const MONEY_SCALE = 2;

/**
 * Rates are strings (`"1.1435"`, `"0.85363"`) because they carry more precision than
 * `Money` can hold. This is the only place that precision matters.
 */
function rateToFx(rate: string) {
  const parsed = FxBig(rate);
  if (parsed.lte(0)) {
    throw new Error(`Invalid currency rate: ${rate}`);
  }
  return parsed;
}

/** Values are 2-decimal money, so round-tripping them through `Money` is lossless */
function valueToFx(value: MoneyLike) {
  return FxBig(Money.from(value).toString(MONEY_SCALE));
}

function toMoney(value: ReturnType<typeof rateToFx>) {
  return Money.from(value.round(MONEY_SCALE, ROUND_HALF_UP).toFixed(MONEY_SCALE));
}

/** Convert an amount in a foreign currency to EUR. `rate` is foreign units per 1 EUR. */
export function foreignToEur(foreign: MoneyLike, rate: string): Money {
  return toMoney(valueToFx(foreign).div(rateToFx(rate)));
}

/** Convert an EUR amount to a foreign currency. `rate` is foreign units per 1 EUR. */
export function eurToForeign(eur: MoneyLike, rate: string): Money {
  return toMoney(valueToFx(eur).times(rateToFx(rate)));
}

/**
 * Derive a flag emoji from an ISO 3166-1 alpha-2 country code by mapping each letter
 * to its regional indicator symbol. Avoids shipping flag images.
 */
export function countryCodeToFlag(countryCode: string | null): string {
  if (!countryCode || countryCode.length !== 2) return '';
  return String.fromCodePoint(
    ...countryCode
      .toUpperCase()
      .split('')
      .map(c => 0x1f1e6 + c.charCodeAt(0) - 'A'.charCodeAt(0)),
  );
}
