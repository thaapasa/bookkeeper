"use strict";

const Big = require('big.js')

class Money {

    constructor(value) {
        this.value = value.c ? value : new Big(value);
    }

    toString(scale) {
        if (scale === undefined) scale = 2;
        return this.value.toFixed(scale);
    }

    format(scale) {
        if (scale === undefined) scale = 2;
        return `this.value.toFixed(scale) €`;
    }

    plus(o) {
        return new Money(this.value.plus(o.value));
    }

    negate() {
        return new Money(this.value.times(-1));
    }

    equals(o) {
        return this.value.eq(o.value);
    }

};

Money.zero = new Money("0");

module.exports = Money;
