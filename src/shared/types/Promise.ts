export type MaybePromise<T> = T | Promise<T>;

export function isPromise<T>(t: any): t is Promise<T> {
  return (
    t &&
    typeof t === 'object' &&
    'then' in t &&
    typeof t.then === 'function' &&
    'catch' in t &&
    typeof t.catch === 'function'
  );
}
