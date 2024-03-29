import { AnyObject, isDefined } from '../types/Common';
import { BkError } from '../types/Errors';
import { getRandomInt } from './Util';

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
  if (ar1.length !== ar2.length) {
    return false;
  }
  ar2.sort();
  return (
    ar1
      .sort()
      .map((a, i) => a === ar2[i])
      .find(i => i === false) === undefined
  );
}

export function indices(num: number): number[] {
  return Array.from(new Array(num), (_, i) => i);
}

export function uniq<T>(array: T[]): T[] {
  return [...new Set(array)];
}

export function hasMatchingElements<T>(a1: T[], a2: T[]): boolean {
  return a1.some(a => a2.includes(a));
}

export function pickRandomItem<T>(arr: T[]): T {
  if (arr.length < 1) {
    throw new BkError('No items in array', 'empty array', 500);
  }
  return arr[getRandomInt(0, arr.length)];
}

export function numberRange(min: number, max: number): number[] {
  const len = max - min + 1;
  if (len < 1) return [];
  if (isNaN(len)) throw new Error('NaN at array length');
  return Array.from(new Array(len), (_, i) => i + min);
}

export function last<T>(arr: T[]): T {
  if (arr.length < 1) {
    throw new Error('last: No elements in array');
  }
  return arr[arr.length - 1];
}

export function unnest<T>(arr: T[][]): T[] {
  const res: T[] = [];
  arr.forEach(a => a.forEach(b => res.push(b)));
  return res;
}

export function toArray<T>(t: T | T[] | undefined | null): T[] {
  return isDefined(t) ? (Array.isArray(t) ? t : [t]) : [];
}

/** Assume input: Array of [name, value] fields */
export function toObject(ar: string[][]): Record<string, string> {
  const res: Record<string, string> = {};
  ar.forEach(a => (res[a[0]] = a[1]));
  return res;
}

export function toMap<T, K extends keyof T>(arr: T[], keyProp: K): Record<string, T> {
  const map: Record<string, T> = {};
  for (const v of arr) {
    map['' + v[keyProp]] = v;
  }
  return map;
}

export function valuesToArray<T extends AnyObject>(a: T): Array<T[keyof T]> {
  const res: Array<T[keyof T]> = [];
  Object.keys(a).map(k => res.push((a as any)[k]));
  return res;
}

export function arrayContains(arr: ReadonlyArray<any>, value: any): boolean {
  for (const o of arr) {
    if (o === value) {
      return true;
    }
  }
  return false;
}

export function partition<T>(filter: (item: T) => boolean, arr: ReadonlyArray<T>): [T[], T[]] {
  return arr.reduce<[T[], T[]]>(
    ([t, f], i) => (filter(i) ? [t.concat(i), f] : [t, f.concat(i)]),
    [[], []],
  );
}

export function groupBy<T, K extends string | number>(
  filter: (item: T) => K,
  arr: ReadonlyArray<T>,
): Record<K, T[]> {
  const res: Record<K, T[]> = {} as any;
  arr.forEach(a => {
    const key = filter(a);
    if (!res[key]) {
      res[key] = [];
    }
    res[key].push(a);
  });
  return res;
}

export function typedFilter<S, T>(f: (x: any) => x is T, arr: S[]): T[] {
  return arr.filter(f) as any;
}
