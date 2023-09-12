import { fail } from "../Assert";

export async function expectThrow<T>(p: () => Promise<T>) {
  try {
    await p();
  } catch (e) {
    // OK, an error was thrown
    return;
  }
  fail('No error was thrown');
}
