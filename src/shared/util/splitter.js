"use strict";

const log = require("./log");
const merge = require("merge");
const Money = require("./money");
const assert = require("assert");
const arrays = require("./arrays");

function splitByShares(sum, division) {
    const numShares = division.map(d => d.share).reduce((a, b) => a + b, 0);
    log.debug("Splitting", sum.format(), "to", numShares, "parts by", division);
    const part = sum.divide(numShares);
    const res = division.map(d => merge({ sum: part.multiply(d.share) }, d));
    const total = res.map(d => d.sum).reduce((a, b) => a.plus(b), Money.zero);
    const remainder = sum.minus(total);
    assert(remainder.gte(Money.zero));
    if (remainder.gt(Money.zero)) {
        const shares = remainder.toCents();
        const ids = [];
        res.forEach(((d, i) => arrays.indices(d.share).forEach(a => ids.push(i))));
        log.debug("Extra share receivers:", ids);
        for (let i = 0; i < shares; i++) {
            log.debug("Adding 1 cent to share #", i, ":", ids[i]);
            res[ids[i]].sum = res[ids[i]].sum.plus(Money.cent);
        }
    }

    const newTotal = res.map(d => d.sum).reduce((a, b) => a.plus(b), Money.zero);
    assert(newTotal.equals(sum));
    log.debug("Divided to", res);
    return res;
}

module.exports = {
    splitByShares: splitByShares
};
