import { expect } from 'bun:test';
import { assertDefined } from 'shared/util';
import { expectSome } from './expectSome';
import { fail } from 'assert';
import { printValue } from 'test/output';

export function expectArrayContaining<T>(actual: T[] | undefined | null, expected: T[]): asserts actual is T[] {
  expect(actual).toBeArray();
  assertDefined(actual);
  for (const exp of expected) {
    try {
      expectSome(actual.map(a => () => expect(a).toEqual(exp)));
    } catch (e) {
      fail(`Expected ${printValue(actual)} to contain ${printValue(exp)}, but could not find it`);
    }
  }
}
