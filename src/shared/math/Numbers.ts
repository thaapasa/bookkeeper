export function sum(a: number, b: number) {
  return a + b;
}

export function sign(n: number) {
  return n < 0 ? -1 : 1;
}

export function clamp(n: number, min: number, max: number) {
  return n < min ? min : n > max ? max : n;
}
