import { getRandomInt } from './Util';
import { Map } from './Objects';

// https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle
export function shuffle<T>(a: T[]): T[] {
  const n = a.length;
  for (let i = 0; i < n - 1; i++) {
    const j = getRandomInt(0, n - i);
    // Swap a[i] and a[i + j]
    const s = a[i];
    a[i] = a[i + j];
    a[i + j] = s;
  }
  return a;
}

export function sortAndCompareElements<T>(ar1: T[], ar2: T[]): boolean {
  if (ar1.length !== ar2.length) { return false; }
  ar2.sort();
  return ar1.sort().map((a, i) => a === ar2[i]).find(i => i === false) === undefined;
}

export function indices(num: number): number[] {
  return Array.apply(null, { length: num }).map(Number.call, Number);
}

export function flatten<T>(arr: any): T[] {
  return arr.reduce((a: any, b: any) => a.concat(Array.isArray(b) ? flatten(b) : b), []);
}

/** Assume input: Array of [name, value] fields */
export function toObject(ar: string[][]): Map<string> {
  const res: Map<string> = {};
  ar.forEach(a => res[a[0]] = a[1]);
  return res;
}

export function toMap<T, K extends keyof T>(arr: T[], keyProp: K): Map<T> {
  const map: Map<T> = {};
  for (const v of arr) {
    map['' + v[keyProp]] = v;
  }
  return map;
}

export function valuesToArray<T extends object>(a: T): Array<T[keyof T]> {
  const res: Array<T[keyof T]> = [];
  Object.keys(a).map(k => res.push((a as any)[k]));
  return res;
}

export function arrayContains(arr: ReadonlyArray<any>, value: any): boolean {
  for (const o of arr) {
    if (o === value) { return true; }
  }
  return false;
}
