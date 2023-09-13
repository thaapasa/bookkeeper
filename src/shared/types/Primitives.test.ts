import { describe, expect, it } from 'bun:test';

import { IntArrayString } from './Primitives';

describe('Primitive types', () => {
  it.each([
    ['[]', []],
    ['[1]', [1]],
    ['[0, 4, 1]', [0, 4, 1]],
    ['[0,4,1]', [0, 4, 1]],
  ])('can decode IntArrayStringZ %s to %s', (str, expected) => {
    expect(IntArrayString.parse(str)).toEqual(expected);
  });
});
