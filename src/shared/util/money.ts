import { Big } from 'big.js';
// Two decimal places
Big.DP = 2;
// Round down (truncate)
Big.RM = 0;

export default class Money {

    public value: Big;

    static toBig(m: any): Big {
        if (m instanceof Big) return m;
        if (m instanceof Money) return m.value;
        return Big(m);
    }

    constructor(value: any) {
        this.value = Money.toBig(value);
    }

    static from(value: any, defaultValue?: any): Money | undefined {
        if (value === null || value === undefined)
            return (defaultValue !== undefined) ? Money.from(defaultValue) : undefined;
        if (value instanceof Money) return value;
        return new Money(value);
    }

    static orZero(value: any): Money {
        return value ? Money.from(value) || Money.zero : Money.zero;
    }

    toString(scale?: number): string {
        if (scale === undefined) scale = 2;
        return this.value.toFixed(scale);
    }

    format(scale?: number): string {
        if (scale === undefined) scale = 2;
        return `${this.value.toFixed(scale)} €`;
    }

    inspect(): string {
        return this.format();
    }

    plus(o: any): Money {
        return new Money(this.value.plus(Money.toBig(o)));
    }

    minus(o: any): Money {
        return new Money(this.value.minus(Money.toBig(o)));
    }

    toCents(): number {
        return parseInt(this.value.times(100).toFixed(0));
    }

    gte(o: any): boolean { return this.value.gte(Money.toBig(o)); }
    gt(o: any): boolean { return this.value.gt(Money.toBig(o)); }
    lte(o: any): boolean { return this.value.lte(Money.toBig(o)); }
    lt(o: any): boolean { return this.value.lt(Money.toBig(o)); }

    divide(o: any): Money {
        return new Money(this.value.div(Money.toBig(o)));
    }

    multiply(o: any): Money {
        return new Money(this.value.times(Money.toBig(o)));
    }

    negate(): Money {
        return new Money(this.value.times(-1));
    }

    equals(o: any): boolean {
        return this.value.eq(Money.toBig(o));
    }

    static zero = new Money("0");
    static euro = new Money("1");
    static cent = new Money("0.01");
}
