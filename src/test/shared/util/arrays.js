"use strict";

const arrays = require("../../../shared/util/arrays");
const chai = require("chai");
const expect = chai.expect;
const describe = require("mocha").describe;
const it = require("mocha").it;

describe("arrays", function() {
    it("should create indices", () => {
        expect(arrays.indices(0)).to.have.members([]);
        expect(arrays.indices(1)).to.have.members([0]);
        expect(arrays.indices(3)).to.have.members([0, 1, 2]);
    });
    it("should compare array elements: true", () => {
        expect(arrays.sortAndCompareElements([], [])).to.equal(true);
        expect(arrays.sortAndCompareElements([1], [1])).to.equal(true);
        expect(arrays.sortAndCompareElements([6, 7, 2], [2, 7, 6])).to.equal(true);
    });
    it("should compare array elements: false", () => {
        expect(arrays.sortAndCompareElements([1], [])).to.equal(false);
        expect(arrays.sortAndCompareElements([2], [1])).to.equal(false);
        expect(arrays.sortAndCompareElements([1, 2, 3], [1, 2])).to.equal(false);
    });
});
