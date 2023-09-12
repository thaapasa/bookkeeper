export function printValue(a: any) {
  if (typeof a === 'object' && a) {
    return JSON.stringify(a, null, 2);
  }
  return String(a);
}
