"use strict";

const chai = require("chai");
const expect = chai.expect;
const client = require("../support/test-client");
const describe = require("mocha").describe;
const it = require("mocha").it;
const after = require("mocha").after;
const testUtil = require("../support/test-util");

function checkSession(s) {
    expect(s.users).to.be.an("array");
    expect(s.groups).to.be.an("array");
    expect(s.token).to.be.a("string");
    expect(s.token.length).to.equal(40);
    expect(s.refreshToken).to.be.a("string");
    expect(s.refreshToken.length).to.equal(40);
    expect(s.sources).to.be.an("array");
    expect(s.categories).to.be.an("array");
    expect(s.user).to.be.an("object");
    expect(s.group).to.be.an("object");
    expect(s.user).to.include({ firstName: "Sauli", lastName: "Niinistö" });
    expect(s.group).to.include({ name: "Mäntyniemi" });
    return s;
}

describe("session", function() {

    function login() {
        return client.getSession("sale", "salasana");
    }

    const testUrl = "/api/source/list";

    it("should give session info with GET", () => login()
        .then(checkSession)
        .then(session => session.get("/api/session")
            .then(checkSession)
            .then(() => session.get(testUrl).then(d => expect(d).to.be.ok))
            .then(() => session.logout())));

    it("should not return data without token", () => testUtil.expectThrow(client.get("", testUrl)));

    it("should not allow GET after logout", () => login()
        .then(session => session.logout()
            .then(x => testUtil.expectThrow(session.get(testUrl)))));

    it("should not allow API access with refreshToken", () => login()
        .then(session => session.logout()
            .then(x => testUtil.expectThrow(session.get(testUrl)))));

    it("should allow refresh with refreshToken", () => login()
        .then(session => client.refreshSession(session.refreshToken)
            .then(checkSession)
            .then(s => (expect(s.token).to.not.equal(session.token) &&
                expect(s.refreshToken).to.not.equal(session.refreshToken), s))
            .then(s => s.get(testUrl).then(d => expect(d).to.be.ok).then(s.logout()))
            .then(session.logout())
        ));

    it("should not allow refresh with refreshToken after logout", () => login()
        .then(session => session.logout()
            .then(x => testUtil.expectThrow(session.get(testUrl)))
            .then(x => testUtil.expectThrow(client.refreshSession(session.refreshToken))
        )));

});
