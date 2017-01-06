"use strict";

const Money = require("../../../shared/util/money");
const splitter = require("../../../shared/util/splitter");
const chai = require("chai");
const expect = chai.expect;

function calculateSum(d) {
    return d.map(d => d.sum).reduce((a, b) => a.plus(b), Money.zero);
}

describe("splitter", () => {
    it("should split 7.01 to 2 parts", () => {
        const split = splitter.splitByShares(new Money("7.01"), [{id: 1, share: 1}, {id: 2, share: 1}]);
        expect(calculateSum(split).toString()).to.equal("7.01");
        expect(split[0].sum.toCents()).to.be.within(350, 351);
        expect(split[1].sum.toCents()).to.be.within(350, 351);
    });
    it("should split 10.00 to 3 parts", () => {
        const split = splitter.splitByShares(new Money("10.00"), [{id: 1, share: 1}, {id: 2, share: 2}]);
        expect(calculateSum(split).toString()).to.equal("10.00");
        expect(split[0].sum.toCents()).to.be.within(333, 334);
        expect(split[1].sum.toCents()).to.be.within(666, 667);
    });
});
