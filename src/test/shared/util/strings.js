"use strict";

const strings = require("../../../shared/util/strings");
const chai = require("chai");
const expect = chai.expect;

describe("strings", () => {

    describe("underscoreToCamelCase", () => {

        it("should convert case correctly", () => {
            expect(strings.underscoreToCamelCase("simple")).to.equal("simple");
            expect(strings.underscoreToCamelCase("my_variable")).to.equal("myVariable");
            expect(strings.underscoreToCamelCase("very_long_name")).to.equal("veryLongName");
            expect(strings.underscoreToCamelCase("")).to.equal("");
        });

        it("should pass-through non-strings", () => {
            expect(strings.underscoreToCamelCase(null)).to.equal(null);
            expect(strings.underscoreToCamelCase(undefined)).to.equal(undefined);
            expect(strings.underscoreToCamelCase(5)).to.equal(5);
        });
    });

});
