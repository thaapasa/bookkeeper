export function sum(a: number, b: number) {
  return a + b;
}

export function sign(n: number) {
  return n < 0 ? -1 : 1;
}

export function clamp(n: number, min: number, max: number) {
  return n < min ? min : n > max ? max : n;
}

/**
 * @returns an array with the values `0 ... n-1`
 */
export function range(n: number) {
  return [...Array(n).keys()];
}

/**
 * @returns an array with the values `min ... max` (both ends inclusive)
 */
export function intRange(min: number, max: number) {
  const len = max - min + 1;
  const arr = [...Array(len).keys()];
  return min !== 0 ? arr.map(i => i + min) : arr;
}
