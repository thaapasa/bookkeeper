"use strict";

const log = require("./../../shared/util/log");
const Money = require("../../shared/util/money");

function InvalidInputError(field, input, requirement) {
    this.code = "INVALID_INPUT";
    this.status = 400;
    this.cause = `Invalid input in ${field}`;
    this.info = {
        field: field,
        input: input,
        requirement: requirement
    };
}
InvalidInputError.prototype = new Error();

function toInt(i, field) {
    if (typeof i === "number") {
        if (Math.floor(i) !== i) throw new InvalidInputError(field, i, "Input must be an integer");
        return i;
    }
    if (typeof i === "string") {
        const n = parseInt(i, 10);
        if (i !== n.toString()) throw new InvalidInputError(field, i, "Input must be an integer");
        return n;
    }
    throw new InvalidInputError(field, i, `Input must be an integer, is of type ${typeof i}`);
}

function fieldPath(prefix, field) {
    return prefix ? `${prefix}.${field}` : field;
}

class Validator {

    static validate(schema, object, prefix) {
        const result = {};
        log.debug("Validating", object);
        Object.keys(schema).forEach(field => {
            const validator = schema[field];
            const fieldName = fieldPath(prefix, field);
            log.debug("Validating", fieldName);
            result[field] = validator(object[field], fieldName);
        });
        log.debug("Validated input to", result);
        return result;
    }

    static number(i, field) {
        if (i === undefined || i === null || (typeof i !== "number") || isNaN(i))
            throw new InvalidInputError(field, i, `Input must be a number`);
        return i;
    }

    static boolean(i, field) {
        if (i === undefined || i === null || (typeof i !== "boolean"))
            throw new InvalidInputError(field, i, `Input must be a boolean`);
        return i;
    }

    static string(i, field) {
        if (i === undefined || i === null || (typeof i !== "string"))
            throw new InvalidInputError(field, i, `Input must be a string`);
        return i;
    }

    static null(i, field) {
        if (i !== null)
            throw new InvalidInputError(field, i, "Input must be null");
        return i;
    }

    static stringWithLength(min, max) {
        return (i, field) => {
            if ((typeof i !== "string") || i.length < min || i.length > max)
                throw new InvalidInputError(field, i, `Input must be a string with ${min}-${max} characters`);
            return i;
        };
    }

    static intBetween(min, max) {
        return (i, field) => {
            const n = toInt(i, field);
            if (n < min || n > max)
                throw new InvalidInputError(field, i, `Input must be an integer in the range [${min}, ${max}]`);
            return n;
        };
    }

    static positiveInt(i, field) {
        const n = toInt(i, field);
        if (n < 1)
            throw new InvalidInputError(field, i, "Input must be a positive integer");
        return n;
    }

    static either() {
        const acceptedValues = Array.prototype.slice.call(arguments);
        return (i, field) => {
            const found = acceptedValues.reduce((found, cur) => found || cur === i, false);
            if (!found)
                throw new InvalidInputError(field, i, "Input must be one of " + acceptedValues);
            return i;
        };
    }

    static listOfObjects(schema) {
        return (i, field) => {
            if (!i || !i.map) throw new InvalidInputError(field, i, "Input must be a list of objects");
            return i.map(item => {
                log.debug("Validating sub-object", item, "of", field, "with schema", schema);
                return Validator.validate(schema, item, field)
            });
        }
    }

    static matchPattern(re) {
        return (i, field) => {
            if ((typeof i !== "string") || !re.test(i))
                throw new InvalidInputError(field, i, `Input must match pattern ${re}`);
            return i;
        };
    }

    static optional(req) {
        return (i, field) => {
            if (typeof i === "undefined") return i;
            return req(i, field);
        }
    }

    static or() {
        return (i, field) => {
            const res = Array.prototype.slice.apply(arguments).reduce((val, cur) => {
                if (val[0]) return val;
                try {
                    return [true, cur(i, field), val[2]];
                } catch (e) {
                    return [false, undefined, val[2].concat(e)];
                }
            }, [false, undefined, []]);
            if (res[0]) return res[1];
            else throw new InvalidInputError(field, i, `Input did not match any matcher: ${res[2].map(e => e.info && e.info.requirement ? e.info.requirement : e)}`);
        }
    }

    static moneyPattern(i, field) {
        return Validator.matchPattern(/[0-9]+([.][0-9]+)?/)(i, field);
    }

    static money(i, field) {
        const money = Validator.moneyPattern(i, field);
        return new Money(money);
    }

    static date(i, field) {
        return Validator.matchPattern(/[0-9]{4}-[0-9]{2}-[0-9]{2}/)(i, field);
    }

}
Validator.InvalidInputError = InvalidInputError;

module.exports = Validator;
