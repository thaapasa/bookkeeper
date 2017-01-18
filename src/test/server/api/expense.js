"use strict";

const chai = require("chai");
const expect = chai.expect;
const client = require("../support/test-client");

describe("session", function() {

    let session = null;

    before(() => client.getSession("sale", "salasana") .then(s => { session = s; return null; }));

    after(() => session && session.logout());

    it("should insert new expense", () => session.put("/api/expense", {
            userId: session.user.id,
            name: "Test expense",
            date: "2017-01-22",
            receiver: "S-market",
            sum: "10.51",
            description: "Karkkia ja porkkanaa",
            categoryId: 2
        })
        .then(s => expect(s.status).to.equal("OK")));

});
