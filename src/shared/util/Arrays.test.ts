import 'jest';
import { indices, sortAndCompareElements } from './Arrays';

describe('arrays', function () {
  it('should create indices', () => {
    expect(indices(0)).toEqual([]);
    expect(indices(1)).toEqual([0]);
    expect(indices(3)).toEqual([0, 1, 2]);
  });
  it('should compare array elements: true', () => {
    expect(sortAndCompareElements([], [])).toEqual(true);
    expect(sortAndCompareElements([1], [1])).toEqual(true);
    expect(sortAndCompareElements([6, 7, 2], [2, 7, 6])).toEqual(true);
  });
  it('should compare array elements: false', () => {
    expect(sortAndCompareElements([1], [])).toEqual(false);
    expect(sortAndCompareElements([2], [1])).toEqual(false);
    expect(sortAndCompareElements([1, 2, 3], [1, 2])).toEqual(false);
  });
});
