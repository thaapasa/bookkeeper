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

    constructor(value) {
        this.value = toBig(value);
    }

    static from(value, defaultValue) {
        if (value === null || value === undefined)
            return (defaultValue !== undefined) ? Money.from(defaultValue) : undefined;
        if (value instanceof Money) return value;
        return new Money(value);
    }

    toString(scale) {
        if (scale === undefined) scale = 2;
        return this.value.toFixed(scale);
    }

    format(scale) {
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

};

Money.zero = new Money("0");
Money.euro = new Money("1");
Money.cent = new Money("0.01");

module.exports = Money;
