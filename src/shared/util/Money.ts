import { Big } from 'big.js';
// Two decimal places
Big.DP = 2;
// Round down (truncate)
Big.RM = 0;

export type MoneyLike = number | Big | Money | string;

const numberFormatOptions: Intl.NumberFormatOptions = {
  style: 'currency',
  currency: 'EUR',
  currencyDisplay: 'symbol',
  useGrouping: true,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
};

export type MoneySign = 'positive' | 'negative' | 'zero';

export default class Money {

  public value: Big;

  public static toBig(m: MoneyLike): Big {
    if (Money.isBig(m)) {
      return m;
    } else if (Money.isMoney(m)) {
      return m.value;
    } else {
      return Big(m);
    }
  }

  public static toValue(m: MoneyLike): number {
    return parseInt(Money.from(m).value.times(100).round().toString(), 10) / 100;
  }

  public constructor(value: MoneyLike) {
    this.value = Money.toBig(value);
  }

  public static isMoney(value: any): value is Money {
    return value instanceof Money && Money.isBig(value.value);
  }

  public static isBig(value: any): value is Big {
    return value instanceof Big && typeof value.eq === 'function';
  }

  public static from(value: MoneyLike | null, defaultValue?: MoneyLike): Money {
    if (value === null || value === undefined) {
      if (defaultValue === undefined) { throw new Error('Money.from(undefined)'); }
      return Money.from(defaultValue);
    }
    if (Money.isMoney(value)) { return value; }
    return new Money(value);
  }

  public static toString(value: MoneyLike) {
    return Money.from(value).toString();
  }

  public static orZero(value: MoneyLike | null | undefined): Money {
    return value ? Money.from(value) || Money.zero : Money.zero;
  }

  public static negate(value: MoneyLike): Money {
    return Money.from(value).negate();
  }

  public sign(): MoneySign {
    return Money.sign(this.value);
  }

  public static sign(value: MoneyLike): MoneySign {
    const b = Money.toBig(value);
    if (b.gt(0)) { return 'positive'; }
    if (b.lt(0)) { return 'negative'; }
    return 'zero';
  }

  public abs(): Money {
    return Money.from(this.value.abs());
  }

  public toString(scale?: number): string {
    if (scale === undefined) { scale = 2; }
    return this.value.toFixed(scale);
  }

  public format(scale?: number): string {
    if (scale === undefined) { scale = 2; }
    return `${Number(this.value).toLocaleString('fi', numberFormatOptions)}`;
  }

  public inspect(): string {
    return this.format();
  }

  public plus(o: any): Money {
    return new Money(this.value.plus(Money.toBig(o)));
  }

  public minus(o: any): Money {
    return new Money(this.value.minus(Money.toBig(o)));
  }

  public toCents(): number {
    return parseInt(this.value.times(100).toFixed(0), 10);
  }

  public gte(o: MoneyLike): boolean { return this.value.gte(Money.toBig(o)); }
  public gt(o: MoneyLike): boolean { return this.value.gt(Money.toBig(o)); }
  public lte(o: MoneyLike): boolean { return this.value.lte(Money.toBig(o)); }
  public lt(o: MoneyLike): boolean { return this.value.lt(Money.toBig(o)); }

  public divide(o: MoneyLike): Money {
    return new Money(this.value.div(Money.toBig(o)));
  }

  public multiply(o: MoneyLike): Money {
    return new Money(this.value.times(Money.toBig(o)));
  }

  public negate(): Money {
    return new Money(this.value.times(-1));
  }

  public equals(o: MoneyLike): boolean {
    return this.value.eq(Money.toBig(o));
  }

  public static equals(o1: MoneyLike, o2: MoneyLike): boolean {
    return Money.from(o1).equals(o2);
  }

  public static zero = new Money('0');
  public static euro = new Money('1');
  public static cent = new Money('0.01');
}
