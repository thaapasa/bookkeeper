"use strict";

const util = require("../../../shared/util/util");
const chai = require("chai");
const expect = chai.expect;
const describe = require("mocha").describe;
const it = require("mocha").it;

describe("strings", () => {

    describe("underscoreToCamelCase", () => {

        it("should convert case correctly", () => {
            expect(util.underscoreToCamelCase("simple")).to.equal("simple");
            expect(util.underscoreToCamelCase("my_variable")).to.equal("myVariable");
            expect(util.underscoreToCamelCase("very_long_name")).to.equal("veryLongName");
            expect(util.underscoreToCamelCase("")).to.equal("");
        });

        it("should pass-through non-strings", () => {
            expect(util.underscoreToCamelCase(null)).to.be.a('null');
            expect(util.underscoreToCamelCase(undefined)).to.be.an('undefined');
            expect(util.underscoreToCamelCase(5)).to.equal(5);
        });
    });

});
