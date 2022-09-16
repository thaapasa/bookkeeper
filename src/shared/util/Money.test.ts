import 'jest';

import { Big } from 'big.js';

import { validate } from 'server/server/Validation';

import { Money, MoneyLike } from './Money';

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
    expect(
      new Money('10').plus(new Money(12.5)).equals(new Money(22.5))
    ).toEqual(true);
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

  it.each([[25], ['25'], [26.44], ['0'], ['0.00']])(
    'validates %s as MoneyLike',
    val => expect(validate(val, MoneyLike, 'tests')).toEqual(val)
  );

  it.each([['25.00 €'], ['foo'], ['12e'], ['263,45 €']])(
    'does not accept %s as MoneyLike',
    val =>
      expect(() => validate(val, MoneyLike, 'tests')).toThrowError(
        new Error('Data format is invalid at tests')
      )
  );
});
