"use strict";

const Big = require('big.js');
// Two decimal places
Big.DP = 2;
// Round down (truncate)
Big.RM = 0;

function toBig(m) {
    if (m instanceof Big) return m;
    if (m instanceof Money) return m.value;
    return Big(m);
}

class Money {

    public value: any;

    constructor(value) {
        this.value = toBig(value);
    }

    static from(value, defaultValue?: any) {
        if (value === null || value === undefined)
            return (defaultValue !== undefined) ? Money.from(defaultValue) : undefined;
        if (value instanceof Money) return value;
        return new Money(value);
    }

    static orZero(value) {
        return value ? Money.from(value) : Money.zero;
    }

    toString(scale?: number) {
        if (scale === undefined) scale = 2;
        return this.value.toFixed(scale);
    }

    format(scale?: number) {
        if (scale === undefined) scale = 2;
        return `${this.value.toFixed(scale)} €`;
    }

    inspect() {
        return this.format();
    }

    plus(o) {
        return new Money(this.value.plus(toBig(o)));
    }

    minus(o) {
        return new Money(this.value.minus(toBig(o)));
    }

    toCents() {
        return parseInt(this.value.times(100).toFixed(0));
    }

    gte(o) { return this.value.gte(toBig(o)); }
    gt(o) { return this.value.gt(toBig(o)); }
    lte(o) { return this.value.lte(toBig(o)); }
    lt(o) { return this.value.lt(toBig(o)); }

    divide(o) {
        return new Money(this.value.div(toBig(o)));
    }

    multiply(o) {
        return new Money(this.value.times(toBig(o)));
    }

    negate() {
        return new Money(this.value.times(-1));
    }

    equals(o) {
        return this.value.eq(toBig(o));
    }

    static zero = new Money("0");
    static euro = new Money("1");
    static cent = new Money("0.01");
}

module.exports = Money;
