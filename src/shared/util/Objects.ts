import { arrayContains } from '../../shared/util/Arrays';

export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

export function pick<T, K extends keyof T>(
  names: ReadonlyArray<K>,
  obj: T
): Pick<T, K> {
  const res: Pick<T, K> = {} as any;
  names.forEach(n => (res[n] = obj[n]));
  return res;
}

export function omit<T, K extends keyof T>(
  names: ReadonlyArray<K>,
  obj: T
): Omit<T, K> {
  const res: Omit<T, K> = {} as any;
  Object.keys(obj)
    .filter(n => !arrayContains(names, n))
    .forEach(n => ((res as any)[n] = (obj as any)[n]));
  return res;
}

export function mapValues<Src, Tgt>(
  mapper: (key: keyof Src, value: Src[keyof Src]) => Tgt,
  obj: Src
): Record<keyof Src, Tgt> {
  const res: Record<keyof Src, Tgt> = {} as any;
  (Object.keys(obj) as Array<keyof Src>).forEach(
    k => (res[k] = mapper(k, obj[k]))
  );
  return res;
}

export const typedKeys: <T>(obj: T) => Array<keyof T> = Object.keys;

export function filterTruthyProps<T>(obj: T): Partial<T> {
  const res: Partial<T> = {};
  typedKeys(obj).forEach(k => {
    if (obj[k]) {
      res[k] = obj[k];
    }
  });
  return res;
}
