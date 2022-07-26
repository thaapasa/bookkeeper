import { either, isLeft, isRight } from 'fp-ts/lib/Either';
import * as io from 'io-ts';

import { ioErrorReporter } from '../validation/ioTsErrorReporter';

export class ValidationError {
  readonly errors: string[];
  readonly value: any;
  constructor(errors: string[], value: any) {
    this.errors = errors;
    this.value = value;
  }
}

export function validate<A, O, I>(type: io.Type<A, O, I>, object: any): A {
  const res = type.decode(object);
  if (isRight(res)) {
    return res.right;
  }
  throw new ValidationError(object, ioErrorReporter(res));
}

export const NumberString = new io.Type<number, string, unknown>(
  'NumberString',
  io.number.is,
  (u, c) =>
    either.chain(io.string.validate(u, c), s => {
      const n = Number(s);
      return isNaN(n)
        ? io.failure(u, c, 'cannot parse to a number')
        : io.success(n);
    }),
  String
);

export const BooleanString = new io.Type<boolean, string, unknown>(
  'BooleanString',
  io.boolean.is,
  (u, c) =>
    either.chain(io.string.validate(u, c), s => {
      const lows = s.toLowerCase();
      return lows === 'true' || lows === 'false'
        ? io.success(Boolean(lows))
        : io.failure(u, c, 'cannot parse to a boolean');
    }),
  String
);

export const IntString = new io.Type<number, string, unknown>(
  'IntString',
  io.number.is,
  (u, c) =>
    either.chain(io.string.validate(u, c), s => {
      const n = Number(s);
      if (isNaN(n)) {
        return io.failure(u, c, 'cannot parse to a number');
      } else if (n !== Math.round(n)) {
        return io.failure(u, c, `${n} is not integer"`);
      } else {
        return io.success(n);
      }
    }),
  String
);

const intArrayStringRE = /^\[[0-9]+(,[0-9]+)*\]$/;

export const IntArrayString = new io.Type<number[], string, unknown>(
  'IntString',
  io.array(io.number).is,
  (u, c) =>
    either.chain(io.string.validate(u, c), s => {
      if (s === '[]') {
        return io.success([]);
      }
      if (!intArrayStringRE.test(s)) {
        return io.failure(u, c, 'cannot parse to int array');
      }
      const ints = s.substr(1, s.length - 2).split(',');
      const res: number[] = [];
      for (const i of ints) {
        const n = IntString.decode(i);
        if (isLeft(n)) {
          return io.failure(u, c, `cannot convert ${n} to number`);
        }
        res.push(n.right);
      }
      return io.success(res);
    }),
  n => '[' + n.join(',') + ']'
);

export function intStringBetween(min: number, max: number) {
  return new io.Type<number, string, unknown>(
    `IntStringBetween${min}And${max}`,
    io.number.is,
    (u, c) =>
      either.chain(IntString.validate(u, c), s => {
        if (s < min) {
          return io.failure(u, c, `${s} < ${min}`);
        } else if (s > max) {
          return io.failure(u, c, `${s} > ${max}`);
        } else {
          return io.success(s);
        }
      }),
    String
  );
}

export function stringWithLength(min: number, max: number) {
  return io.refinement(io.string, t => t.length >= min && t.length <= max);
}

export function NonEmptyArray<C extends io.Any>(codec: C) {
  return io.refinement(
    io.array(codec),
    a => a.length > 0,
    `NonEmptyArray<${codec.name}>`
  );
}
