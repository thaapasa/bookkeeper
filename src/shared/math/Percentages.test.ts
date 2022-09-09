import 'jest';

import { sum } from './Numbers';
import { toPercentageDistribution } from './Percentages';

describe('Percentages', () => {
  it.each([
    [[], []],
    [[1], [1]],
    [[100], [1]],
    [
      [50, 150],
      [0.25, 0.75],
    ],
    [
      [1, 3, 4, 2],
      [0.1, 0.3, 0.4, 0.2],
    ],
    [
      [1, -1],
      [1, 0],
    ],
    [
      [1, 2, -2, -1, 1],
      [0.25, 0.5, 0, 0, 0.25],
    ],
  ])('calculates percentage distribution of %s to %p', (values, distr) => {
    if (distr.length > 0) {
      expect(distr.reduce(sum, 0)).toEqual(1);
    }
    expect(toPercentageDistribution(values)).toEqual(distr);
  });
});
