import { isDefined } from '../types/Common';
import { BkError } from '../types/Errors';
import { arrayContains } from '../util/Arrays';

export function pick<T extends object, K extends keyof T>(
  names: ReadonlyArray<K>,
  obj: T,
): Pick<T, K> {
  const res: Pick<T, K> = {} as any;
  names.forEach(n => (res[n] = obj[n]));
  return res;
}

export function omit<T extends object, K extends keyof T>(
  names: ReadonlyArray<K>,
  obj: T,
): Omit<T, K> {
  const res: Omit<T, K> = {} as any;
  Object.keys(obj)
    .filter(n => !arrayContains(names, n))
    .forEach(n => ((res as any)[n] = (obj as any)[n]));
  return res;
}

export function mapValues<Src extends object, Tgt>(
  mapper: (key: keyof Src, value: Src[keyof Src]) => Tgt,
  obj: Src,
): Record<keyof Src, Tgt> {
  const res: Record<keyof Src, Tgt> = {} as any;
  (Object.keys(obj) as Array<keyof Src>).forEach(k => (res[k] = mapper(k, obj[k])));
  return res;
}

export const typedKeys: <T>(obj: T) => Array<keyof T> = Object.keys;

export function filterDefinedProps<T>(obj: T): Partial<T> {
  const res: Partial<T> = {};
  typedKeys(obj).forEach(k => {
    if (isDefined(obj[k])) {
      res[k] = obj[k];
    }
  });
  return res;
}

export function requireDefined<T>(t: T | undefined | null, title?: string): T {
  if (!isDefined(t)) {
    throw new BkError('NOT_DEFINED', `Required value${title ? ' ' + title : ''} was ${t}`, 500, t);
  }
  return t;
}

export function toRecord<T extends string | number | symbol, S>(
  items: T[],
  conv: (t: T) => S,
): Record<T, S> {
  const res: Record<T, S> = {} as any;
  items.forEach(i => (res[i] = conv(i)));
  return res;
}

/**
 * Structural equality for JSON-like values (plain objects, arrays, primitives).
 * Keys with `undefined` values are treated as absent.
 */
export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
  if (Array.isArray(a) || Array.isArray(b)) {
    return (
      Array.isArray(a) &&
      Array.isArray(b) &&
      a.length === b.length &&
      a.every((v, i) => deepEqual(v, b[i]))
    );
  }
  const recA = a as Record<string, unknown>;
  const recB = b as Record<string, unknown>;
  const keysA = Object.keys(recA).filter(k => recA[k] !== undefined);
  const keysB = Object.keys(recB).filter(k => recB[k] !== undefined);
  return keysA.length === keysB.length && keysA.every(k => deepEqual(recA[k], recB[k]));
}

export function recordFromPairs<K extends string | number | symbol, V>(
  items: [K, V][],
): Record<K, V> {
  const res: Record<K, V> = {} as any;
  items.forEach(([k, v]) => (res[k] = v));
  return res;
}
