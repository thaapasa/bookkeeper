export async function timeout(ms: number): Promise<void> {
  return new Promise<void>(resolve => setTimeout(resolve, ms));
}

export async function timeoutImmediate(): Promise<void> {
  return new Promise<void>(resolve => setImmediate(resolve));
}
