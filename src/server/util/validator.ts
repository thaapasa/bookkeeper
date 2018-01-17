import Money from '../../shared/util/money';
import { Error } from '../../shared/types/errors';
import { Map } from '../../shared/util/util';
const debug = require('debug')('bookkeeper:validator');

class InvalidInputError<T> extends Error {
    constructor(field: string, input: T, requirement: string) {
        super('INVALID_INPUT', `Invalid input in ${field}`, 400, {
            field: field,
            input: input,
            requirement: requirement
        });
    }
}

function toInt(i: any, field: string): number {
    if (typeof i === 'number') {
        if (Math.floor(i) !== i) throw new InvalidInputError(field, i, 'Input must be an integer');
        return i;
    }
    if (typeof i === 'string') {
        const n = parseInt(i, 10);
        if (i !== n.toString()) throw new InvalidInputError(field, i, 'Input must be an integer');
        return n;
    }
    throw new InvalidInputError(field, i, `Input must be an integer, is of type ${typeof i}`);
}

function fieldPath(prefix: string | undefined, field: string): string {
    return prefix ? `${prefix}.${field}` : field;
}

export interface Schema<T> {}
type ValidationFunction<T> = (i: any, field: string) => T;

export class Validator {

    public static validate<T>(schema: Schema<T>, object: any, prefix?: string): T {
        const result = {};
        debug('Validating', object);
        Object.keys(schema).forEach(field => {
            const validator = schema[field];
            const fieldName = fieldPath(prefix, field);
            debug('Validating', fieldName);
            result[field] = validator(object[field], fieldName);
        });
        debug('Validated input to', result);
        return result as T;
    }

    static number: ValidationFunction<number> = (i, field) => {
        if (i === undefined || i === null || (typeof i !== 'number') || isNaN(i)) {
            throw new InvalidInputError(field, i, 'Input must be a number');
        }
        return i;
    }

    static boolean: ValidationFunction<boolean> = (i, field) => {
        if (i === undefined || i === null || (typeof i !== 'boolean')) {
            throw new InvalidInputError(field, i, 'Input must be a boolean');
        }
        return i;
    }

    static string: ValidationFunction<string> = (i, field) => {
        if (i === undefined || i === null || (typeof i !== 'string')) {
            throw new InvalidInputError(field, i, `Input must be a string`);
        }
        return i as string;
    }

    static null: ValidationFunction<null> = (i, field) => {
        if (i !== null) {
            throw new InvalidInputError(field, i, 'Input must be null');
        }
        return i;
    }

    static stringWithLength(min: number, max: number): ValidationFunction<string> {
        return (i, field) => {
            if ((typeof i !== 'string') || i.length < min || i.length > max) {
                throw new InvalidInputError(field, i, `Input must be a string with ${min}-${max} characters`);
            }
            return i;
        };
    }

    static intBetween(min: number, max: number): ValidationFunction<number> {
        return (i, field) => {
            const n = toInt(i, field);
            if (n < min || n > max) {
                throw new InvalidInputError(field, i, `Input must be an integer in the range [${min}, ${max}]`);
            }
            return n;
        };
    }

    static positiveInt: ValidationFunction<number> = (i, field) => {
        const n = toInt(i, field);
        if (n < 1) {
            throw new InvalidInputError(field, i, 'Input must be a positive integer');
        }
        return n;
    }

    static nonNegativeInt: ValidationFunction<number> = (i, field) => {
        const n = toInt(i, field);
        if (n < 0) {
            throw new InvalidInputError(field, i, 'Input must be a positive integer');
        }
        return n;
    }

    static either<T>(...acceptedValues: T[]): ValidationFunction<T> {
        return (i, field) => {
            const found = acceptedValues.reduce((found, cur) => found || cur === i, false);
            if (!found) {
                throw new InvalidInputError(field, i, 'Input must be one of ' + acceptedValues);
            }
            return i;
        };
    }

    static listOfObjects<T>(schema: Schema<T>): ValidationFunction<any[]> {
        return (i, field) => {
            if (!i || !i.map) {
                throw new InvalidInputError(field, i, 'Input must be a list of objects');
            }
            return i.map(item => {
                debug('Validating sub-object', item, 'of', field, 'with schema', schema);
                return Validator.validate(schema, item, field)
            });
        }
    }

    static matchPattern(re: RegExp): ValidationFunction<string> {
        return (i, field) => {
            if ((typeof i !== 'string') || !re.test(i)) {
                throw new InvalidInputError(field, i, `Input must match pattern ${re}`);
            }
            return i;
        };
    }

    static optional<T>(req: ValidationFunction<T>): ValidationFunction<T | undefined> {
        return (i, field) => {
            if (typeof i === "undefined") { return i; }
            return req(i, field);
        }
    }

    static or<T>(...args: ValidationFunction<T>[]): ValidationFunction<T> {
        return (i, field) => {
            const res = args.reduce((val, cur) => {
                if (val[0]) { return val; }
                try {
                    return [true, cur(i, field), val[2]];
                } catch (e) {
                    return [false, undefined, val[2].concat(e)];
                }
            }, [false, undefined, []] as [boolean, any, any[]]);
            if (res[0]) { 
                return res[1]; 
            } else { 
                throw new InvalidInputError(field, i, `Input did not match any matcher: ${res[2].map(e => e.info && e.info.requirement ? e.info.requirement : e)}`); 
            }
        }
    }

    static moneyPattern: ValidationFunction<string> = (i, field) => {
        return Validator.matchPattern(/[0-9]+([.][0-9]+)?/)(i, field);
    }

    static money: ValidationFunction<Money> = (i, field) => {
        const money = Validator.moneyPattern(i, field);
        return new Money(money);
    }

    static date: ValidationFunction<string> = (i, field) => {
        return Validator.matchPattern(/[0-9]{4}-[0-9]{2}-[0-9]{2}/)(i, field);
    }

    static InvalidInputError = InvalidInputError;
}
