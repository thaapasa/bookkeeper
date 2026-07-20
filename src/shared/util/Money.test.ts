import { Big } from 'big.js';
import { describe, expect, it } from 'bun:test';

import { validate } from 'shared/types';

import { evaluateMoneyExpression, Money, MoneyLike } from './Money';

describe('Money', () => {
  it('should be created from valid strings', () => {
    expect(new Money('100.57').toString()).toEqual('100.57');
    expect(new Money('100.5').toString()).toEqual('100.50');
    expect(new Money('167').toString()).toEqual('167.00');
  });

  it('should be created from numbers', () => {
    expect(new Money(100.57).toString()).toEqual('100.57');
    expect(new Money(100.5).toString()).toEqual('100.50');
    expect(new Money(167).toString()).toEqual('167.00');
  });

  it('should be created from Big', () => {
    expect(new Money(Big(100.57)).toString()).toEqual('100.57');
    expect(new Money(new Big(100.57)).toString()).toEqual('100.57');
  });

  it('should have equals', () => {
    expect(new Money('100').equals(new Money(100))).toEqual(true);
    expect(new Money('100').equals(new Money(101))).toEqual(false);
  });

  it('should have plus', () => {
    expect(new Money('10').plus(new Money(12.5)).toString()).toEqual('22.50');
    expect(new Money('10').plus(new Money(12.5)).equals(new Money(22.5))).toEqual(true);
  });
  it('should sum a list of values', () => {
    expect(Money.sum([]).toString()).toEqual('0.00');
    expect(Money.sum(['1.50', 2, new Money('-0.25')]).toString()).toEqual('3.25');
    expect(Money.sum([Money.zero, Money.cent]).toString()).toEqual('0.01');
  });

  it('should equal when created from money', () => {
    const m = new Money(100);
    expect(Money.from(m)).toEqual(m);
    expect(Money.from(m) === m).toEqual(true);
  });

  it('should divide rounding down', () => {
    expect(new Money('2').divide(3).toString()).toEqual('0.66');
    expect(new Money('2').divide(3).toString(3)).toEqual('0.660');
  });

  it.each<(string | number)[]>([[25], ['25'], [26.44], ['0'], ['0.00']])(
    'validates %s as MoneyLike',
    val => {
      expect(validate(val, MoneyLike, 'tests')).toEqual(val);
    },
  );

  it.each([['25.00 €'], ['foo'], ['12e'], ['263,45 €']])('does not accept %s as MoneyLike', val =>
    expect(() => validate(val, MoneyLike, 'tests')).toThrow(
      new Error('Data format is invalid at tests'),
    ),
  );

  describe('format', () => {
    // The fi locale formats with NBSP separators and U+2212 minus; normalize
    // to plain ASCII so the assertions stay readable
    const fmt = (m: Money, scale?: number, options?: Intl.NumberFormatOptions) =>
      m
        .format(scale, options)
        .replace(/\u00A0/g, ' ')
        .replace(/\u2212/g, '-');

    it('defaults to exactly two decimals', () => {
      expect(fmt(new Money('1234.56'))).toEqual('1 234,56 €');
      expect(fmt(new Money('10'))).toEqual('10,00 €');
      expect(fmt(new Money('12.567'))).toEqual('12,57 €');
    });

    it('formats negative values', () => {
      expect(fmt(new Money('-5.5'))).toEqual('-5,50 €');
    });

    it('rounds to whole euros with scale 0', () => {
      expect(fmt(new Money('1234.56'), 0)).toEqual('1 235 €');
      expect(fmt(new Money('0.49'), 0)).toEqual('0 €');
    });

    it('clamps both min and max fraction digits to an explicit scale', () => {
      expect(fmt(new Money('12.345'), 3)).toEqual('12,345 €');
      expect(fmt(new Money('10'), 1)).toEqual('10,0 €');
      // scale wins over conflicting options
      expect(
        fmt(new Money('12.345'), 1, { minimumFractionDigits: 3, maximumFractionDigits: 3 }),
      ).toEqual('12,3 €');
    });

    it('lets options override the two-decimal default when scale is omitted', () => {
      expect(
        fmt(new Money('1234.56'), undefined, {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }),
      ).toEqual('1 235 €');
    });
  });
});

describe('evaluateMoneyExpression', () => {
  it('evaluates addition', () => {
    expect(evaluateMoneyExpression('10 + 20')).toEqual('30.00');
  });

  it('evaluates subtraction', () => {
    expect(evaluateMoneyExpression('124.42 - 23.42 + 3.33')).toEqual('104.33');
  });

  it('evaluates multiplication and division', () => {
    expect(evaluateMoneyExpression('10 * 3')).toEqual('30.00');
    expect(evaluateMoneyExpression('10 / 4')).toEqual('2.50');
  });

  it('respects operator precedence', () => {
    expect(evaluateMoneyExpression('10 + 2 * 3')).toEqual('16.00');
    expect(evaluateMoneyExpression('10 - 6 / 2')).toEqual('7.00');
  });

  it('handles commas as decimal separators', () => {
    expect(evaluateMoneyExpression('10,50 + 2,30')).toEqual('12.80');
  });

  it('handles negative first number', () => {
    expect(evaluateMoneyExpression('-5 + 10')).toEqual('5.00');
  });

  it('returns undefined for plain numbers', () => {
    expect(evaluateMoneyExpression('42.50')).toBeUndefined();
    expect(evaluateMoneyExpression('0')).toBeUndefined();
  });

  it('handles parentheses', () => {
    expect(evaluateMoneyExpression('(10 + 5) * 2')).toEqual('30.00');
    expect(evaluateMoneyExpression('100 - (30 + 20)')).toEqual('50.00');
  });

  it('handles nested parentheses', () => {
    expect(evaluateMoneyExpression('((10 + 5) * 2) + 1')).toEqual('31.00');
    expect(evaluateMoneyExpression('10 * (2 + (3 - 1))')).toEqual('40.00');
  });

  it('handles negative number after open paren', () => {
    expect(evaluateMoneyExpression('(-5 + 10)')).toEqual('5.00');
  });

  it('returns undefined for invalid input', () => {
    expect(evaluateMoneyExpression('abc')).toBeUndefined();
    expect(evaluateMoneyExpression('')).toBeUndefined();
    expect(evaluateMoneyExpression('10 +')).toBeUndefined();
    expect(evaluateMoneyExpression('(10 + 5')).toBeUndefined();
    expect(evaluateMoneyExpression('10 + 5)')).toBeUndefined();
  });
});
