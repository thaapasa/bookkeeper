import debug from 'debug';
import { Error } from '../../shared/types/Errors';
import Money from '../../shared/util/Money';

const log = debug('bookkeeper:validator');

class InvalidInputError<T> extends Error {
  constructor(field: string, input: T, requirement: string) {
    super('INVALID_INPUT', `Invalid input in ${field}`, 400, {
      field,
      input,
      requirement,
    });
  }
}

function toInt(i: any, field: string): number {
  if (typeof i === 'number') {
    if (Math.floor(i) !== i) {
      throw new InvalidInputError(field, i, 'Input must be an integer');
    }
    return i;
  }
  if (typeof i === 'string') {
    const n = parseInt(i, 10);
    if (i !== n.toString()) {
      throw new InvalidInputError(field, i, 'Input must be an integer');
    }
    return n;
  }
  throw new InvalidInputError(
    field,
    i,
    `Input must be an integer, is of type ${typeof i}`
  );
}

function fieldPath(prefix: string | undefined, field: string): string {
  return prefix ? `${prefix}.${field}` : field;
}

type ValidationFunction<T> = (i: any, field: string) => T;
export type Schema<T> = Record<string, ValidationFunction<any | T>>;

export class Validator {
  public static validate<T>(
    schema: Schema<T>,
    object: any,
    prefix?: string
  ): T {
    const result = {};
    log('Validating', object);
    Object.keys(schema).forEach(field => {
      const validator = (schema as any)[field];
      const fieldName = fieldPath(prefix, field);
      log('Validating', fieldName);
      (result as any)[field] = validator(object[field], fieldName);
    });
    log('Validated input to', result);
    return result as T;
  }

  public static number: ValidationFunction<number> = (i, field) => {
    if (i === undefined || i === null || typeof i !== 'number' || isNaN(i)) {
      throw new InvalidInputError(field, i, 'Input must be a number');
    }
    return i;
  };

  public static boolean: ValidationFunction<boolean> = (i, field) => {
    if (i === undefined || i === null || typeof i !== 'boolean') {
      throw new InvalidInputError(field, i, 'Input must be a boolean');
    }
    return i;
  };

  public static string: ValidationFunction<string> = (i, field) => {
    if (i === undefined || i === null || typeof i !== 'string') {
      throw new InvalidInputError(field, i, `Input must be a string`);
    }
    return i as string;
  };

  public static null: ValidationFunction<null> = (i, field) => {
    if (i !== null) {
      throw new InvalidInputError(field, i, 'Input must be null');
    }
    return i;
  };

  public static stringWithLength(
    min: number,
    max: number
  ): ValidationFunction<string> {
    return (i, field) => {
      if (typeof i !== 'string' || i.length < min || i.length > max) {
        throw new InvalidInputError(
          field,
          i,
          `Input must be a string with ${min}-${max} characters`
        );
      }
      return i;
    };
  }

  public static intBetween(
    min: number,
    max: number
  ): ValidationFunction<number> {
    return (i, field) => {
      const n = toInt(i, field);
      if (n < min || n > max) {
        throw new InvalidInputError(
          field,
          i,
          `Input must be an integer in the range [${min}, ${max}]`
        );
      }
      return n;
    };
  }

  public static positiveInt: ValidationFunction<number> = (i, field) => {
    const n = toInt(i, field);
    if (n < 1) {
      throw new InvalidInputError(field, i, 'Input must be a positive integer');
    }
    return n;
  };

  public static nonNegativeInt: ValidationFunction<number> = (i, field) => {
    const n = toInt(i, field);
    if (n < 0) {
      throw new InvalidInputError(field, i, 'Input must be a positive integer');
    }
    return n;
  };

  public static either<T>(...acceptedValues: T[]): ValidationFunction<T> {
    return (i, field) => {
      const found = acceptedValues.reduce((f, cur) => f || cur === i, false);
      if (!found) {
        throw new InvalidInputError(
          field,
          i,
          'Input must be one of ' + acceptedValues
        );
      }
      return i;
    };
  }

  public static listOfObjects(schema: Schema<any>): ValidationFunction<any[]> {
    return (i, field) => {
      if (!i || !i.map) {
        throw new InvalidInputError(
          field,
          i,
          'Input must be a list of objects'
        );
      }
      return i.map((item: any) => {
        log('Validating sub-object', item, 'of', field, 'with schema', schema);
        return Validator.validate(schema, item, field);
      });
    };
  }

  public static matchPattern(re: RegExp): ValidationFunction<string> {
    return (i, field) => {
      if (typeof i !== 'string' || !re.test(i)) {
        throw new InvalidInputError(field, i, `Input must match pattern ${re}`);
      }
      return i;
    };
  }

  public static optional<T>(
    req: ValidationFunction<T>
  ): ValidationFunction<T | undefined> {
    return (i, field) => {
      if (i === undefined) {
        return i;
      }
      return req(i, field);
    };
  }

  public static or<T>(
    ...args: Array<ValidationFunction<T>>
  ): ValidationFunction<T> {
    return (i, field) => {
      const [pass, val, errors] = args.reduce<[boolean, any, any[]]>(
        ([p, v, e], operand) => {
          if (p) {
            return [p, v, e];
          }
          try {
            return [true, operand(i, field), e];
          } catch (error) {
            return [false, undefined, e.concat(error)];
          }
        },
        [false, undefined, []]
      );
      if (pass) {
        return val;
      } else {
        throw new InvalidInputError(
          field,
          i,
          `Input did not match any matcher: ${errors.map((e: any) =>
            e.info && e.info.requirement ? e.info.requirement : e
          )}`
        );
      }
    };
  }

  public static moneyPattern: ValidationFunction<string> = (i, field) => {
    return Validator.matchPattern(/[0-9]+([.][0-9]+)?/)(i, field);
  };

  public static money: ValidationFunction<Money> = (i, field) => {
    const money = Validator.moneyPattern(i, field);
    return new Money(money);
  };

  public static date: ValidationFunction<string> = (i, field) => {
    return Validator.matchPattern(/[0-9]{4}-[0-9]{2}-[0-9]{2}/)(i, field);
  };

  public static InvalidInputError = InvalidInputError;
}
