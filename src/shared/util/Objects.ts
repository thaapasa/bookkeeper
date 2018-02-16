import { arrayContains } from '../../shared/util/Arrays';

export type Diff<T extends string, U extends string> = ({[P in T]: P} & {[P in U]: never} & {[x: string]: never})[T];
export type Omit<T, K extends keyof T> = Pick<T, Diff<keyof T, K>>;

export function pick<T, K extends keyof T>(names: ReadonlyArray<K>, obj: T): Pick<T, K> {
  const res: Pick<T, K> = {} as any;
  names.forEach(n => res[n] = obj[n]);
  return res;
}

export function omit<T, K extends keyof T>(names: ReadonlyArray<K>, obj: T): Omit<T, K> {
  const res: T & Omit<T, K> = {} as any;
  Object.keys(obj)
    .filter(n => !arrayContains(names, n))
    .forEach(n => (res as any)[n] = (obj as any)[n]);
  return res;
}

export function mapValues<T, K extends keyof T>(mapper: (key: K, value: T[K]) => T[K], obj: T): T {
  const res: T = { ...obj as any };
  Object.keys(obj).forEach(k => res[k as K] = mapper(k as K, obj[k as K]));
  return res;
}
