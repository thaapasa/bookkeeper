import Money from './money';
import { indices } from './arrays';
const debug = require('debug')('bookkeeper:splitter');
const assert = require('assert');

export interface ShareDivision {
    share: number;
}

export interface ShareSum extends ShareDivision {
    sum: Money;
}

export function splitByShares(sum: Money, division: ShareDivision[]): ShareSum[] {
    const numShares = division.map(d => d.share).reduce((a, b) => a + b, 0);
    debug('Splitting', sum.format(), 'to', numShares, 'parts by', division);
    const part = sum.divide(numShares);
    const res: ShareSum[] = division.map(d => Object.assign({ sum: part.multiply(d.share) }, d));
    const total = res.map(d => d.sum).reduce((a, b) => a.plus(b), Money.zero);
    const remainder = sum.minus(total);
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
    assert(newTotal.equals(sum));
    debug('Divided to', res);
    return res;
}

export function negateDivision(d: ShareSum[]): ShareSum[] {
    return d.map(b => Object.assign({}, b, { sum: b.sum.negate() }));
}
