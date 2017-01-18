"use strict";

const chai = require("chai");
const expect = chai.expect;
const client = require("../support/test-client");
const describe = require("mocha").describe;
const it = require("mocha").it;
const before = require("mocha").before;
const after = require("mocha").after;

describe("expense", function() {

    let session = null;

    before(() => client.getSession("sale", "salasana").then(s => { session = s; return null; }));

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
