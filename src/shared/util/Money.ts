import { Big } from 'big.js';
import { z } from 'zod';
// Two decimal places
Big.DP = 2;
// Round down (truncate)
Big.RM = 0;

export type MoneyLike = string | number | Money | Big;

const MoneyLikeRE = /^-?[0-9]+(.[0-9]+)?$/;
export function isMoneyLike(e: unknown): e is MoneyLike {
  switch (typeof e) {
    case 'number':
      return true;
    case 'string':
      return MoneyLikeRE.test(e);
    case 'object':
      return (e !== null && Money.isMoney(e)) || Money.isBig(e);
    default:
      return false;
  }
}

const numberFormatOptions: Intl.NumberFormatOptions = {
  style: 'currency',
  currency: 'EUR',
  currencyDisplay: 'symbol',
  useGrouping: true,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
};

export type MoneySign = 'positive' | 'negative' | 'zero';

export class Money {
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
    if (typeof m === 'number') {
      return m;
    }
    return (
      parseInt(Money.from(m).value.times(100).round().toString(), 10) / 100
    );
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
      if (defaultValue === undefined) {
        throw new Error('Money.from(undefined)');
      }
      return Money.from(defaultValue);
    }
    if (Money.isMoney(value)) {
      return value;
    }
    return new Money(
      typeof value === 'string' ? sanitizeMoneyInput(value) : value
    );
  }

  public static parse(value: MoneyLike | null): Money | undefined {
    if (value === null || value === undefined) return;
    try {
      return Money.from(value);
    } catch (e) {
      return;
    }
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
    if (b.gt(0)) {
      return 'positive';
    }
    if (b.lt(0)) {
      return 'negative';
    }
    return 'zero';
  }

  public valueOf(): number {
    return Money.toValue(this);
  }

  public static valueOf(m: MoneyLike): number {
    return Money.toValue(m);
  }

  public isValid(): boolean {
    return !isNaN(this.valueOf());
  }

  public abs(): Money {
    return Money.from(this.value.abs());
  }

  public toString(scale?: number): string {
    if (scale === undefined) {
      scale = 2;
    }
    return this.value.toFixed(scale);
  }

  public format(scale?: number, options?: Intl.NumberFormatOptions): string {
    return `${Number(this.value).toLocaleString('fi', {
      ...numberFormatOptions,
      ...options,
      minimumFractionDigits: scale ?? 2,
    })}`;
  }

  public inspect(): string {
    return this.format();
  }

  public plus(o: any): Money {
    return new Money(this.value.plus(Money.toBig(o)));
  }

  public static plus(a: MoneyLike, b: MoneyLike): Money {
    return Money.from(a).plus(b);
  }

  public minus(o: any): Money {
    return new Money(this.value.minus(Money.toBig(o)));
  }

  public toCents(): number {
    return parseInt(this.value.times(100).toFixed(0), 10);
  }

  public gte(o: MoneyLike): boolean {
    return this.value.gte(Money.toBig(o));
  }
  public gt(o: MoneyLike): boolean {
    return this.value.gt(Money.toBig(o));
  }
  public lte(o: MoneyLike): boolean {
    return this.value.lte(Money.toBig(o));
  }
  public lt(o: MoneyLike): boolean {
    return this.value.lt(Money.toBig(o));
  }

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

export function sanitizeMoneyInput(v: string): string {
  return v?.replace(/,/, '.').replace(/ +/g, '') ?? '';
}

export const MoneyV = z
  .any()
  .refine(v => isMoneyLike(v))
  .transform(v => Money.from(v))
  .refine(v => v.isValid());

const BigShape = z
  .object({
    c: z.array(z.number()),
    abs: z.function(),
    cmp: z.function(),
  })
  .refine(v => Money.isBig(v))
  .transform<Big>(v => v as Big);

const MoneyShape = z
  .object({ value: BigShape })
  .refine(v => Money.isMoney(v))
  .transform<Money>(v => v as Money);

export const MoneyLike = z
  .union([z.string(), z.number(), MoneyShape, BigShape])
  .refine(t => isMoneyLike(t) && MoneyV.safeParse(t).success, {
    message: 'String does not encode a proper monetary amount',
  });
