"use strict";

const Money = require("../../../shared/util/money");
const chai = require("chai");
const expect = chai.expect;
const Big = require("big.js");

describe("Money", function() {
    it("should be created from valid strings", () => {
        expect(new Money("100.57").toString()).to.equal("100.57");
        expect(new Money("100.5").toString()).to.equal("100.50");
        expect(new Money("167").toString()).to.equal("167.00");
    });

    it("should be created from numbers", () => {
        expect(new Money(100.57).toString()).to.equal("100.57");
        expect(new Money(100.5).toString()).to.equal("100.50");
        expect(new Money(167).toString()).to.equal("167.00");
    });

    it("should be created from Big", () => {
        expect(new Money(Big(100.57)).toString()).to.equal("100.57");
        expect(new Money(new Big(100.57)).toString()).to.equal("100.57");
    });

    it("should have equals", () => {
        expect(new Money("100").equals(new Money(100))).to.equal(true);
        expect(new Money("100").equals(new Money(101))).to.equal(false);
    });

    it("should have plus", () => {
        expect(new Money("10").plus(new Money(12.50)).toString()).to.equal("22.50");
        expect(new Money("10").plus(new Money(12.50)).equals(new Money(22.50))).to.equal(true);
    });

    it("should divide rounding down", () => {
        expect(new Money("2").divide(3).toString()).to.equal("0.66");
        expect(new Money("2").divide(3).toString(3)).to.equal("0.660");
    });
});
