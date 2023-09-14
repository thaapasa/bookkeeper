import assert from 'assert';
import { Logger } from 'pino';

import { indices } from '../util/Arrays';
import { Money, MoneyLike } from '../util/Money';

export interface HasShares {
  userId: number;
  share: number;
}

export interface HasSum {
  sum: Money;
}

export function splitByShares<T extends HasShares>(
  sum: MoneyLike,
  division: T[],
  logger?: Logger,
): Array<T & HasSum> {
  const numShares = division.map(d => d.share).reduce((a, b) => a + b, 0);
  const moneySum = Money.from(sum);
  logger?.debug(division, 'Splitting %s to %s parts by', moneySum.format(), numShares);
  const part = moneySum.divide(numShares);
  const res: Array<T & HasSum> = division.map(d => ({
    sum: part.multiply(d.share),
    ...(d as any),
  }));
  const total = res.map(d => d.sum).reduce((a, b) => a.plus(b), Money.zero);
  const remainder = moneySum.minus(total);
  assert(remainder.gte(Money.zero));
  if (remainder.gt(Money.zero)) {
    const shares = remainder.toCents();
    const ids: number[] = [];
    res.forEach((d, i) => indices(d.share).forEach(() => ids.push(i)));
    logger?.debug(ids, 'Extra share receivers:');
    for (let i = 0; i < shares; i++) {
      logger?.debug(`Adding 1 cent to share #${i}: ${ids[i]}`);
      res[ids[i]].sum = res[ids[i]].sum.plus(Money.cent);
    }
  }

  const newTotal = res.map(d => d.sum).reduce((a, b) => a.plus(b), Money.zero);
  assert(newTotal.equals(moneySum));
  logger?.debug(res.map(r => ({ ...r, sum: sum.toString() }), 'Divided to'));
  return res;
}

export function negateDivision<T extends { sum: MoneyLike }>(d: T[]): T[] {
  return d.map(b => ({ ...(b as any), sum: Money.from(b.sum).negate() }));
}
