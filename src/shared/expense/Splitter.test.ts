import { describe, expect, it } from 'bun:test';

import { Money } from '../util/Money';
import { HasSum, splitByShares } from './Splitter';

function calculateSum(d: HasSum[]) {
  return d.map(s => s.sum).reduce((a, b) => a.plus(b), Money.zero);
}

describe('splitter', () => {
  it('should split 7.01 to 2 parts', () => {
    const split = splitByShares(new Money('7.01'), [
      { share: 1, userId: 1 },
      { id: 2, share: 1, userId: 2 },
    ]);
    expect(calculateSum(split).toString()).toEqual('7.01');
    expect(split[0].sum.toCents()).toBeGreaterThanOrEqual(350);
    expect(split[1].sum.toCents()).toBeCloseTo(350);
  });
  it('should split 10.00 to 3 parts', () => {
    const split = splitByShares(new Money('10.00'), [
      { share: 1, userId: 1 },
      { id: 2, share: 2, userId: 2 },
    ]);
    expect(calculateSum(split).toString()).toEqual('10.00');
    expect(split[0].sum.toCents()).toBeGreaterThanOrEqual(333);
    expect(split[1].sum.toCents()).toBeGreaterThanOrEqual(666);
  });
});
