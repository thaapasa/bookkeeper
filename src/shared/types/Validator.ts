import { either, isLeft, isRight } from 'fp-ts/lib/Either';
import * as t from 'io-ts';

import { ioErrorReporter } from '../validation/ioTsErrorReporter';

export class ValidationError {
  readonly errors: string[];
  readonly value: any;
  constructor(errors: string[], value: any) {
    this.errors = errors;
    this.value = value;
  }
}

export function validate<A, O, I>(type: t.Type<A, O, I>, object: any): A {
  const res = type.decode(object);
  if (isRight(res)) {
    return res.right;
  }
  throw new ValidationError(object, ioErrorReporter(res));
}

export const TNumberString = new t.Type<number, string, unknown>(
  'NumberString',
  t.number.is,
  (u, c) =>
    either.chain(t.string.validate(u, c), s => {
      const n = Number(s);
      return isNaN(n)
        ? t.failure(u, c, 'cannot parse to a number')
        : t.success(n);
    }),
  String
);

export const TBooleanString = new t.Type<boolean, string, unknown>(
  'BooleanString',
  t.boolean.is,
  (u, c) =>
    either.chain(t.string.validate(u, c), s => {
      const lows = s.toLowerCase();
      return lows === 'true' || lows === 'false'
        ? t.success(Boolean(lows))
        : t.failure(u, c, 'cannot parse to a boolean');
    }),
  String
);

export const TIntString = new t.Type<number, string, unknown>(
  'IntString',
  t.number.is,
  (u, c) =>
    either.chain(t.string.validate(u, c), s => {
      const n = Number(s);
      if (isNaN(n)) {
        return t.failure(u, c, 'cannot parse to a number');
      } else if (n !== Math.round(n)) {
        return t.failure(u, c, `${n} is not integer"`);
      } else {
        return t.success(n);
      }
    }),
  String
);

const intArrayStringRE = /^\[[0-9]+(,[0-9]+)*\]$/;

export const TIntArrayString = new t.Type<number[], string, unknown>(
  'IntString',
  t.array(t.number).is,
  (u, c) =>
    either.chain(t.string.validate(u, c), s => {
      if (s === '[]') {
        return t.success([]);
      }
      if (!intArrayStringRE.test(s)) {
        return t.failure(u, c, 'cannot parse to int array');
      }
      const ints = s.substr(1, s.length - 2).split(',');
      const res: number[] = [];
      for (const i of ints) {
        const n = TIntString.decode(i);
        if (isLeft(n)) {
          return t.failure(u, c, `cannot convert ${n} to number`);
        }
        res.push(n.right);
      }
      return t.success(res);
    }),
  n => '[' + n.join(',') + ']'
);

export function intStringBetween(min: number, max: number) {
  return new t.Type<number, string, unknown>(
    `IntStringBetween${min}And${max}`,
    t.number.is,
    (u, c) =>
      either.chain(TIntString.validate(u, c), s => {
        if (s < min) {
          return t.failure(u, c, `${s} < ${min}`);
        } else if (s > max) {
          return t.failure(u, c, `${s} > ${max}`);
        } else {
          return t.success(s);
        }
      }),
    String
  );
}

export function stringWithLength(min: number, max: number) {
  return t.refinement(t.string, t => t.length >= min && t.length <= max);
}
