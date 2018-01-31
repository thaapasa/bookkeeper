import 'jest';
import { Error } from '../../types/Errors';
import { fail } from 'assert';

// TODO: See if this is neede
export class NoErrorThrownError extends Error {
  constructor() {
    super('NoErrorThrownError', 'Expected an error, but no error was thrown', 500);
  }
}

export async function expectThrow<T>(p: () => Promise<T>) {
  try {
    await p();
  } catch (e) {
    // OK, an error was thrown
    return;
  }
  fail('No error was thrown');
}
