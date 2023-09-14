import { fail } from 'shared/util/Assert';

type TestFun = () => void;

export function expectSome(tests: TestFun[]) {
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
