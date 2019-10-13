import * as t from 'io-ts';
import { isRight, either } from 'fp-ts/lib/Either';

export class ValidationError {
  readonly errors: t.Errors;
  readonly value: any;
  constructor(errors: t.Errors, value: any) {
    this.errors = errors;
    this.value = value;
  }
}

export function validate<A, O, I>(type: t.Type<A, O, I>, object: any): A {
  const res = type.decode(object);
  if (isRight(res)) {
    return res.right;
  }
  const errors = res.left;
  throw new ValidationError(object, errors);
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
