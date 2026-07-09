import { describe, expect, it } from 'bun:test';

import { countryCodeToFlag, eurToForeign, foreignToEur } from './Currency';
import { Money } from './Money';

// ECB reference rates (foreign units per 1 EUR)
const USD = '1.1435';
const GBP = '0.85363';

describe('currency conversion', () => {
  it('converts a foreign amount to EUR', () => {
    expect(foreignToEur('50', USD).toString()).toEqual('43.73');
    expect(foreignToEur('100', GBP).toString()).toEqual('117.15');
  });

  it('converts an EUR amount to a foreign currency', () => {
    expect(eurToForeign('100', USD).toString()).toEqual('114.35');
    expect(eurToForeign('100', GBP).toString()).toEqual('85.36');
  });

  it('applies the rate at full precision, not clamped to two decimals', () => {
    // A rate truncated to 0.85 would yield 117.65 instead of 117.15
    expect(foreignToEur('100', GBP).toString()).toEqual('117.15');
    expect(foreignToEur('100', '0.85').toString()).toEqual('117.65');
  });

  it('rounds half-up rather than truncating', () => {
    // 50 / 1.1435 = 43.7254..., which Money.divide() would truncate to 43.72
    expect(foreignToEur('50', USD).toString()).toEqual('43.73');
    // 100 / 0.85363 = 117.1467..., truncation would give 117.14
    expect(foreignToEur('100', GBP).toString()).toEqual('117.15');
  });

  it('accepts every MoneyLike form for the value', () => {
    expect(foreignToEur(50, USD).toString()).toEqual('43.73');
    expect(foreignToEur('50,00', USD).toString()).toEqual('43.73');
    expect(foreignToEur(Money.from('50'), USD).toString()).toEqual('43.73');
  });

  it('round-trips to within a cent (2dp values make it lossy by design)', () => {
    const eur = foreignToEur('50', USD);
    expect(eur.toString()).toEqual('43.73');
    // Converting back does not return exactly 50.00; the annotation is an estimate
    expect(eurToForeign(eur, USD).toString()).toEqual('50.01');
  });

  it('rejects a non-positive rate', () => {
    expect(() => foreignToEur('50', '0')).toThrow();
    expect(() => foreignToEur('50', '-1.5')).toThrow();
  });

  it('does not disturb the global Big configuration used by Money', () => {
    // Money relies on the global Big.DP = 2, Big.RM = 0 (truncate).
    // Importing the FX module must not change that.
    expect(Money.from('100').divide('1.0857').toString()).toEqual('92.10');
    expect(Money.from('10').divide('3').toString()).toEqual('3.33');
    expect(Money.from('100.999').toString()).toEqual('100.99');
  });
});

describe('countryCodeToFlag', () => {
  it('maps an alpha-2 code to a flag emoji', () => {
    expect(countryCodeToFlag('US')).toEqual('🇺🇸');
    expect(countryCodeToFlag('gb')).toEqual('🇬🇧');
    expect(countryCodeToFlag('SE')).toEqual('🇸🇪');
  });

  it('returns an empty string for missing or malformed codes', () => {
    expect(countryCodeToFlag(null)).toEqual('');
    expect(countryCodeToFlag('')).toEqual('');
    expect(countryCodeToFlag('USA')).toEqual('');
  });
});
