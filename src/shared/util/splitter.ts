import Money, { MoneyLike } from './money';
import { indices } from './arrays';
const debug = require('debug')('bookkeeper:splitter');
const assert = require('assert');

export interface HasShares {
    userId: number;
    share: number;
}

export interface HasSum {
    sum: Money;
}

export function splitByShares<T extends HasShares>(sum: MoneyLike, division: T[]): Array<T & HasSum> {
    const numShares = division.map(d => d.share).reduce((a, b) => a + b, 0);
    const moneySum = Money.from(sum);
    debug('Splitting', moneySum.format(), 'to', numShares, 'parts by', division);
    const part = moneySum.divide(numShares);
    const res: Array<T & HasSum> = 
        division.map(d => ({ sum: part.multiply(d.share), ...d as any }));
    const total = res.map(d => d.sum).reduce((a, b) => a.plus(b), Money.zero);
    const remainder = moneySum.minus(total);
    assert(remainder.gte(Money.zero));
    if (remainder.gt(Money.zero)) {
        const shares = remainder.toCents();
        const ids: number[] = [];
        res.forEach(((d, i) => indices(d.share).forEach(a => ids.push(i))));
        debug('Extra share receivers:', ids);
        for (let i = 0; i < shares; i++) {
            debug('Adding 1 cent to share #', i, ':', ids[i]);
            res[ids[i]].sum = res[ids[i]].sum.plus(Money.cent);
        }
    }

    const newTotal = res.map(d => d.sum).reduce((a, b) => a.plus(b), Money.zero);
    assert(newTotal.equals(moneySum));
    debug('Divided to', res);
    return res;
}

export function negateDivision<T extends { sum: MoneyLike }>(d: T[]): T[] {
    return d.map(b => ({ ...b as any, sum: Money.from(b.sum).negate() }));;
}
