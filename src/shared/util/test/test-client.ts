"use strict";

const request = Promise.promisifyAll(require("superagent"));
const log = require("../../../shared/util/log");

const baseUrl = "http://localhost:3000";

function doRequest(creator, token, query) {
    return creator()
        .query(query ? query : {})
        .set("Authorization", `Bearer ${token}`)
        .endAsync()
        .then(req => req.body)
        .catch(e => { log.warn(e.response && e.response.error ? e.response.error : e.response); throw e; })
}

function get(token, path, query) {
    return doRequest(() => request.get(`${baseUrl}${path}`), token, query);
}

function put(token, path, data) {
    return doRequest(() => request.put(`${baseUrl}${path}`).send(data).set("Content-Type", "application/json"), token)
}

function post(token, path, data) {
    return doRequest(() => request.post(`${baseUrl}${path}`).send(data).set("Content-Type", "application/json"), token)
}

function del(token, path, query) {
    return doRequest(() => request.delete(`${baseUrl}${path}`), token, query);
}

function login(username, password) {
    const url = `${baseUrl}/api/session`;
    return request.put(url)
        .set('Content-Type', 'application/json')
        .send({ username: username, password: password })
        .endAsync()
        .then(req => req.body);
}

function refresh(refreshToken) {
    return put(refreshToken, "/api/session/refresh", {});
}

function getSession(username, password) {
    return login(username, password).then(decorateSession)
}

function refreshSession(refreshToken) {
    return refresh(refreshToken).then(decorateSession)
}

function decorateSession(s) {
    return Object.assign({
        get: (path, query) => get(s.token, path, query),
        logout: () => del(s.token, "/api/session"),
        put: (path, data) => put(s.token, path, data),
        post: (path, data) => post(s.token, path, data),
        del: (path, query) => del(s.token, path, query)
    }, s);
}

module.exports = {
    get: get,
    del: del,
    put: put,
    post: post,
    login: login,
    getSession: getSession,
    refreshSession: refreshSession
};
