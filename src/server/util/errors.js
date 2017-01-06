"use strict";

const strings = require("./../../shared/util/strings");

module.exports = {};

module.exports.undefinedToError = function(errorType, p1, p2, p3) {
    return value => {
        if (value === undefined) throw new errorType(p1, p2, p3);
        else return value;
    }
};

function NotFoundError(code, name) {
    this.code = code;
    this.status = 404;
    this.cause = `${strings.ucFirst(name)} not found`;
}
NotFoundError.prototype = new Error();
module.exports.NotFoundError = NotFoundError;
