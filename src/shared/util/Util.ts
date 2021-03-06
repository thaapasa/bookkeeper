import { AnyObject } from 'client/ui/Types';

export function ucFirst(str: any): string {
  return typeof str === 'string' && str.length > 0
    ? str.charAt(0).toUpperCase() + str.substr(1)
    : '';
}

export function underscoreToCamelCase(str: any): string {
  if (typeof str === 'number') {
    return str.toString();
  }
  if (typeof str !== 'string') {
    return '';
  }
  if (str.length < 2) {
    return str;
  }
  return str
    .split('_')
    .map((v, i) => (i === 0 ? v : ucFirst(v)))
    .join('');
}

export function camelCaseObject<T extends AnyObject>(o: T): T {
  if (typeof o !== 'object') {
    return o;
  }
  const r = {} as T;
  Object.keys(o).forEach(
    k => ((r as any)[underscoreToCamelCase(k)] = (o as any)[k])
  );
  return r;
}

export function filterCaseInsensitive(
  match: string,
  values: string[]
): string[] {
  const matcher = (match || '').toLowerCase();
  return values.filter(v => v.toLowerCase().includes(matcher));
}

export function filterMapCaseInsensitive<T>(
  match: string,
  values: T[],
  mapper: (v: T) => string
): T[] {
  const matcher = (match || '').toLowerCase();
  return values.filter(v => mapper(v).toLowerCase().includes(matcher));
}

export function leftPad(
  s: string | number,
  length: number,
  padding = ' '
): string {
  let res = (s || '').toString();
  while (res.length < length) {
    res = padding + res;
  }
  return res;
}

// Returns a random integer between min (included) and max (excluded)
// Using Math.round() will give you a non-uniform distribution!
export function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min)) + min;
}

export function optNumber(x: any): number | undefined {
  return x === null || x === undefined ? undefined : Number(x);
}

export function identity<T>(x: T): T {
  return x;
}

export async function asyncIdentity<T>(x: T): Promise<T> {
  return x;
}

export function noop() {
  return;
}
