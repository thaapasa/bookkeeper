"use strict";

const chai = require("chai");
const expect = chai.expect;
const errors = require("../../../shared/types/errors");
const log = require("../../../shared/util/log");

module.exports = {};

function NoErrorThrownError() {
    this.type = "NoErrorThrownError";
}
NoErrorThrownError.prototype = new Error();

module.exports.expectThrow = (p) => log.suppressFor(() => Promise.resolve(p)
    .then(x => { throw new NoErrorThrownError() })
    .catch(e => expect(e.type).to.not.equal("NoErrorThrownError", "No error was thrown")));
