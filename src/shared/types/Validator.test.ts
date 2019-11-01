import 'jest';
import * as t from 'io-ts';
import { TIntArrayString } from './Validator';

describe('Validator', () => {
  it('can decode TIntArrayString', () => {
    expect(TIntArrayString.decode('[]')).toEqual(t.success([]));
    expect(TIntArrayString.decode('[1]')).toEqual(t.success([1]));
    expect(TIntArrayString.decode('[0,4,1]')).toEqual(t.success([0, 4, 1]));
  });
  it('can encode TIntArrayString', () => {
    expect(TIntArrayString.encode([])).toEqual('[]');
    expect(TIntArrayString.encode([1])).toEqual('[1]');
    expect(TIntArrayString.encode([4, 5, 2])).toEqual('[4,5,2]');
  });
});
