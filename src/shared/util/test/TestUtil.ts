import 'jest';
import { Error } from '../../types/Errors';
import { fail } from 'assert';

export async function expectThrow<T>(p: () => Promise<T>) {
  try {
    await p();
  } catch (e) {
    // OK, an error was thrown
    return;
  }
  fail('No error was thrown');
}