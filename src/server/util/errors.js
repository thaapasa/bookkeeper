"use strict";

const util = require("./../../shared/util/util");

module.exports = {};

module.exports.undefinedToError = function(errorType, p1, p2, p3) {
    return value => {
        if (value === undefined) throw new errorType(p1, p2, p3);
        else return value;
    }
};

module.exports.emptyToError = function(errorType, p1, p2, p3) {
    return value => {
        if (value === undefined || value === null || (Array.isArray(value) && value.length === 0)) throw new errorType(p1, p2, p3);
        else return value;
    }
};

function NotFoundError(code, name) {
    this.code = code;
    this.status = 404;
    this.cause = `${util.ucFirst(name)} not found`;
}
NotFoundError.prototype = new Error();
module.exports.NotFoundError = NotFoundError;
