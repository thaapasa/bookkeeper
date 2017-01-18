"use strict";

const Promise = require("bluebird");
const request = Promise.promisifyAll(require("superagent"));

const baseUrl = "http://localhost:3000";
let token = "";

function get(path, query) {
    return request.get(`${baseUrl}${path}`)
        .query(query ? query : {})
        .set("Authorization", `Bearer ${token}`)
        .endAsync()
        .then(req => req.body)
}

function login(username, password) {
    const url = `${baseUrl}/api/session`;

    return request.put(url)
        .set('Content-Type', 'application/json')
        .send({username: username, password: password})
        .endAsync()
        .then(req => req.body);
}

module.exports = {
    get: get,
    login: login
};
