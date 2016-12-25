"use strict";

const log = require("./log");


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

function toInt(field, i) {
    if (typeof i === "number") {
        if (Math.floor(i) !== i) throw new InvalidInputError(field, i, "Input must be an integer");
    }
    if (typeof i === "string") {
        const n = parseInt(i, 10);
        if (i !== n.toString()) throw new InvalidInputError(field, i, "Input must be an integer");
        return n;
    }
    throw new InvalidInputError(field, i, "Input must be an integer");
}

const validator = {

    validate: function(schema, object) {
        const result = {};
        Object.keys(schema).forEach(field => {
            const validator = schema[field];
            log.debug("Validating", field, "in", object);
            result[field] = validator(object[field], field);
        });
        log.debug("Validated input to", result);
        return result;
    },

    number: function(i) {
        return i !== undefined && i !== null && (typeof i === "number") && !isNaN(i);
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
            const n = toInt(field, i);
            if (n < min || n > max)
                throw new InvalidInputError(field, i, `Input must be an integer in the range [${min}, ${max}]`);
            return n;
        };
    },

    matchPattern(re) {
        return (i, field) => {
            if ((typeof i !== "string") || !re.test(i))
                throw new InvalidInputError(field, i, `Input must match pattern ${re}`);
            return i;
        };
    }

};

module.exports = validator;
