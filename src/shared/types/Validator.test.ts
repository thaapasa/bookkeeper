import 'jest';

import { IntArrayStringZ } from './Validator';

describe('Validator', () => {
  it.each([
    ['[]', []],
    ['[1]', [1]],
    ['[0, 4, 1]', [0, 4, 1]],
    ['[0,4,1]', [0, 4, 1]],
  ])('can decode IntArrayStringZ %s to %s', (str, expected) => {
    expect(IntArrayStringZ.parse(str)).toEqual(expected);
  });
});
