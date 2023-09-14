import { BkError } from '../types/Errors';

export function assert(condition: boolean, title?: string): asserts condition is true {
  if (!condition) {
    fail(`Assertion failed${title ? ': ' + title : ''}`);
  }
}

export function fail(message: string, cause?: any) {
  throw new BkError(`Fail: ${message}`, cause, 500);
}
