"use strict";

const log = require("./log");
const config = require("../config");
const sessions = require("../data/sessions");

function handleError(res) {
    return e => {
        log.warn("Error", e);
        const data = { type: "error", code: e.code ? e.code : "INTERNAL_ERROR" };
        const status = typeof(e.status) == "number" ? e.status : 500;
        if (config.showErrorCause) {
            data.cause = e.cause ? e.cause : e;
        }
        res.status(status).json(data);
    }
}

function processUnauthorizedRequest(handler) {
    return (req, res) => {
        log.debug(req.method, req.url);
        return handler(req, res)
            .then(r => res.json(r))
            .catch(handleError(res));
    };
}

const tokenNotPresent = {
    code: "TOKEN_MISSING",
    status: 403,
    cause: "Authorization token missing"
};
function processRequest(handler) {
    return (req, res) => {
        log.debug(req.method, req.url);
        try {
            const token = getToken(req);
            sessions.getSession(token)
                .then(u => handler(u, req, res))
                .then(r => res.json(r))
                .catch(handleError(res));
        } catch (e) {
            handleError(res)(e);
        }
    };
}

const bearerMatch = /Bearer ([0-9a-zA-Z]*)/;
function getToken(req) {
    const tmatch = bearerMatch.exec(req.header("Authorization"));
    const token = tmatch && tmatch.length > 0 ? tmatch[1] : undefined;
    if (!token) throw tokenNotPresent;
    return token;
}

module.exports = {
    processRequest: processRequest,
    processUnauthorizedRequest: processUnauthorizedRequest,
    handleError: handleError
};
