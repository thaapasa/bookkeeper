"use strict";

const chai = require("chai");
const expect = chai.expect;
const client = require("../support/test-client");

describe("login", function() {

    it("should create session when logging in", () => {
        return client.login("sale", "salasana")
            .then(u => expect(u).to.be.an("object") &&
                expect(u.token).to.be.a("string") &&
                expect(u.token.length).to.be.above(20))
    });

});
