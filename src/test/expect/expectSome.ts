import { fail } from 'assert';

export function expectSome(tests: Function[]) {
  for (const test of tests) {
    try {
      test();
      // One test passed!
      return;
    } catch (e) {
      // Ok, it's okay that some fail
    }
  }
  fail(`None of the ${tests.length} tests passed`);
}
