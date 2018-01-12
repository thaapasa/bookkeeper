import { Big } from 'big.js';
// Two decimal places
Big.DP = 2;
// Round down (truncate)
Big.RM = 0;

type MoneyInputType = number | Big | Money | string;

export default class Money {

    public value: Big;

    public static toBig(m: MoneyInputType): Big {
        if (m instanceof Big) return m;
        if (m instanceof Money) return m.value;
        return Big(m);
    }

    public constructor(value: MoneyInputType) {
        this.value = Money.toBig(value);
    }

    public static from(value: MoneyInputType | null, defaultValue?: MoneyInputType): Money {
        if (value === null || value === undefined) {
            if (defaultValue === undefined) { throw new Error('Money.from(undefined)'); }
            return Money.from(defaultValue);
        }
        if (value instanceof Money) { return value; }
        return new Money(value);
    }

    public static orZero(value: MoneyInputType | null | undefined): Money {
        return value ? Money.from(value) || Money.zero : Money.zero;
    }

    public toString(scale?: number): string {
        if (scale === undefined) scale = 2;
        return this.value.toFixed(scale);
    }

    public format(scale?: number): string {
        if (scale === undefined) scale = 2;
        return `${this.value.toFixed(scale)} €`;
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
        return parseInt(this.value.times(100).toFixed(0));
    }

    public gte(o: MoneyInputType): boolean { return this.value.gte(Money.toBig(o)); }
    public gt(o: MoneyInputType): boolean { return this.value.gt(Money.toBig(o)); }
    public lte(o: MoneyInputType): boolean { return this.value.lte(Money.toBig(o)); }
    public lt(o: MoneyInputType): boolean { return this.value.lt(Money.toBig(o)); }

    public divide(o: MoneyInputType): Money {
        return new Money(this.value.div(Money.toBig(o)));
    }

    public multiply(o: MoneyInputType): Money {
        return new Money(this.value.times(Money.toBig(o)));
    }

    public negate(): Money {
        return new Money(this.value.times(-1));
    }

    public equals(o: MoneyInputType): boolean {
        return this.value.eq(Money.toBig(o));
    }

    public static zero = new Money('0');
    public static euro = new Money('1');
    public static cent = new Money('0.01');
}
