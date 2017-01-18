"use strict";

const Promise = require("bluebird");
const request = Promise.promisifyAll(require("superagent"));

const baseUrl = "http://localhost:3000";

function doRequest(creator, token, query) {
    return creator()
        .query(query ? query : {})
        .set("Authorization", `Bearer ${token}`)
        .endAsync()
        .then(req => req.body)
}

function get(token, path, query) {
    return doRequest(() => request.get(`${baseUrl}${path}`), token, query);
}

function del(token, path, query) {
    return doRequest(() => request.delete(`${baseUrl}${path}`), token, query);
}

function login(username, password) {
    const url = `${baseUrl}/api/session`;

    return request.put(url)
        .set('Content-Type', 'application/json')
        .send({username: username, password: password})
        .endAsync()
        .then(req => req.body);
}

function getSession(username, password) {
    return login(username, password)
        .then(s => ({
            token: s.token,
            get: (path, query) => get(s.token, path, query),
            logout: () => del(s.token, "/api/session")
        }))
}

module.exports = {
    get: get,
    del: del,
    login: login,
    getSession: getSession
};
