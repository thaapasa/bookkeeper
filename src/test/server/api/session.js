"use strict";

const chai = require("chai");
const expect = chai.expect;
const client = require("../support/test-client");

describe("session", function() {

    let session = null;

    before(() =>
        client.getSession("sale", "salasana")
            .then(s => {
                session = s;
                return expect(s).to.be.an("object") &&
                    expect(s.token).to.be.a("string") &&
                    expect(s.token.length).to.be.above(20)
            })
    );

    after(() => session && session.logout());

    it("should give session info with GET", () => session.get("/api/session")
        .then(s => expect(s.users).to.be.an("array") &&
            expect(s.groups).to.be.an("array") &&
            expect(s.token).to.be.a("string") &&
            expect(s.sources).to.be.an("array") &&
            expect(s.categories).to.be.an("array") &&
            expect(s.user).to.be.an("object") &&
            expect(s.group).to.be.an("object") &&
            expect(s.user).to.include({ firstName: "Sauli", lastName: "Niinistö" }) &&
            expect(s.group).to.include({ name: "Mäntyniemi" })));

});
