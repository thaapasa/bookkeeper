"use strict";

const log = require("./log");


function InvalidInputError(field, input) {
    this.code = "INVALID_INPUT";
    this.status = 400;
    this.cause = `Invalid input in ${field}`;
    this.info = {
        field: field,
        input: input
    };
}
InvalidInputError.prototype = new Error();

const validator = {

    validate: function(schema, object) {
        Object.keys(schema).forEach(field => {
            const validator = schema[field];
            log.debug("Validating", field, "in", object);
            if (!validator(object[field])) {
                throw new InvalidInputError(field, object[field]);
            }
        });
        return object;
    },

    number: function(i) {
        return i !== undefined && i !== null && (typeof i === "number") && !isNaN(i);
    },

    stringWithLength(min, max) {
        return i => (typeof i === "string") && i.length >= min && i.length <= max;
    }

};

module.exports = validator;
