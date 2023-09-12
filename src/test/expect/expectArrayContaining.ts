import { expect } from 'bun:test';
import { printValue } from 'test/output';

import { assertDefined } from 'shared/util';
import { fail } from 'shared/util/Assert';

import { expectSome } from './expectSome';

export function expectArrayContaining<T>(
  actual: T[] | undefined | null,
  expected: T[]
): asserts actual is T[] {
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
