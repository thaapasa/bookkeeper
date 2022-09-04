import 'jest';

import { IntArrayString } from './Validator';

describe('Validator', () => {
  it.each([
    ['[]', []],
    ['[1]', [1]],
    ['[0, 4, 1]', [0, 4, 1]],
    ['[0,4,1]', [0, 4, 1]],
  ])('can decode IntArrayStringZ %s to %s', (str, expected) => {
    expect(IntArrayString.parse(str)).toEqual(expected);
  });
});
