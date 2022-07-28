import 'jest';

import * as t from 'io-ts';

import { IntArrayString } from './Validator';

describe('Validator', () => {
  it('can decode IntArrayString', () => {
    expect(IntArrayString.decode('[]')).toEqual(t.success([]));
    expect(IntArrayString.decode('[1]')).toEqual(t.success([1]));
    expect(IntArrayString.decode('[0,4,1]')).toEqual(t.success([0, 4, 1]));
  });
  it('can encode IntArrayString', () => {
    expect(IntArrayString.encode([])).toEqual('[]');
    expect(IntArrayString.encode([1])).toEqual('[1]');
    expect(IntArrayString.encode([4, 5, 2])).toEqual('[4,5,2]');
  });
});
