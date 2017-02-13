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

const validator = {

    validate: function(schema, object, prefix) {
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
    },

    number: (i, field) => {
        if (i === undefined || i === null || (typeof i !== "number") || isNaN(i))
            throw new InvalidInputError(field, i, `Input must be a number`);
        return i;
    },

    boolean: (i, field) => {
        if (i === undefined || i === null || (typeof i !== "boolean"))
            throw new InvalidInputError(field, i, `Input must be a boolean`);
        return i;
    },

    string: (i, field) => {
        if (i === undefined || i === null || (typeof i !== "string"))
            throw new InvalidInputError(field, i, `Input must be a string`);
        return i;
    },

    null: (i, field) => {
        if (i !== null)
            throw new InvalidInputError(field, i, "Input must be null");
        return i;
    },

    stringWithLength(min, max) {
        return (i, field) => {
            if ((typeof i !== "string") || i.length < min || i.length > max)
                throw new InvalidInputError(field, i, `Input must be a string with ${min}-${max} characters`);
            return i;
        };
    },

    intBetween(min, max) {
        return (i, field) => {
            const n = toInt(i, field);
            if (n < min || n > max)
                throw new InvalidInputError(field, i, `Input must be an integer in the range [${min}, ${max}]`);
            return n;
        };
    },

    positiveInt: (i, field) => {
        const n = toInt(i, field);
        if (n < 1)
            throw new InvalidInputError(field, i, "Input must be a positive integer");
        return n;
    },

    listOfObjects(schema) {
        return (i, field) => {
            if (!i || !i.map) throw new InvalidInputError(field, i, "Input must be a list of objects");
            return i.map(item => {
                log.debug("Validating sub-object", item, "of", field, "with schema", schema);
                return validator.validate(schema, item, field)
            });
        }
    },

    matchPattern(re) {
        return (i, field) => {
            if ((typeof i !== "string") || !re.test(i))
                throw new InvalidInputError(field, i, `Input must match pattern ${re}`);
            return i;
        };
    },

    optional(req) {
        return (i, field) => {
            if (typeof i === "undefined") return i;
            return req(i, field);
        }
    },

    or() {
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
};

const moneyPattern = validator.matchPattern(/[0-9]+([.][0-9]+)?/);
validator.money = (i, field) => {
    const money = moneyPattern(i, field);
    return new Money(money);
};
validator.InvalidInputError = InvalidInputError;

module.exports = validator;
