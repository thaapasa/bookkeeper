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

    matchPattern(re) {
        return (i, field) => {
            if ((typeof i !== "string") || !re.test(i))
                throw new InvalidInputError(field, i, `Input must match pattern ${re}`);
            return i;
        };
    }

};

module.exports = validator;
