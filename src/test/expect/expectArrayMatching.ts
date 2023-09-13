import { fail } from 'assert';
import { expect } from 'bun:test';
import { printValue } from 'test/output';

import { assertDefined } from 'shared/util';

import { expectSome } from './expectSome';

export function expectArrayMatching<E extends object, A extends object>(
  actual: A[] | undefined | null,
  expected: E[],
) {
  expect(actual).toBeArray();
  assertDefined(actual);
  for (const exp of expected) {
    try {
      expectSome(actual.map(a => () => expect(a).toMatchObject(exp)));
    } catch (e) {
      fail(
        `Expected ${printValue(actual)} to contain value matching ${printValue(
          exp,
        )}, but could not find it`,
      );
    }
  }
}
