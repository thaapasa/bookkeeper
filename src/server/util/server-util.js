"use strict";

const log = require("./log");
const config = require("../config");
const sessions = require("../data/sessions");
const moment = require("moment");

function handleError(res) {
    return e => {
        log.warn("Error", e);
        const data = { type: "error", code: e.code ? e.code : "INTERNAL_ERROR" };
        const status = typeof(e.status) == "number" ? e.status : 500;
        if (config.showErrorCause) {
            data.cause = e.cause ? e.cause : e;
        }
        if (e.info) {
            data.info = e.info;
        }
        res.status(status).json(data);
    }
}

function processUnauthorizedRequest(handler) {
    return (req, res) => {
        log.debug(req.method, req.url);
        return handler(req, res)
            .then(r => setNoCacheHeaders(res).json(r))
            .catch(handleError(res));
    };
}

function processRequest(handler) {
    return (req, res) => {
        log.debug(req.method, req.url);
        try {
            const token = getToken(req);
            sessions.getSession(token, req.query.groupId)
                .then(session => handler(session, req, res))
                .then(r => setNoCacheHeaders(res).json(r))
                .catch(handleError(res));
        } catch (e) {
            handleError(res)(e);
        }
    };
}

const httpDateHeaderPattern = "ddd, DD MMM YYYY HH:mm:ss";
function setNoCacheHeaders(res) {
    res.set("Cache-Control", "private, no-cache, no-store, must-revalidate, max-age=0");
    res.set("Pragma", "no-cache");
    const time = moment().utc().format(httpDateHeaderPattern) + " GMT";
    res.set("Date", time);
    res.set("Expires", time);
    return res;
}

function TokenNotPresentError() {
    this.code = "TOKEN_MISSING";
    this.status = 401;
    this.cause = "Authorization token missing";
}
TokenNotPresentError.prototype = new Error();

const bearerMatch = /Bearer ([0-9a-zA-Z]*)/;
function getToken(req) {
    const tmatch = bearerMatch.exec(req.header("Authorization"));
    const token = tmatch && tmatch.length > 0 ? tmatch[1] : undefined;
    if (!token) throw new TokenNotPresentError();
    return token;
}

function getId(pathRE, req, position) {
    if (position === undefined) position = 1;
    return parseInt(pathRE.exec(req.url)[position], 10);
}

module.exports = {
    processRequest: processRequest,
    processUnauthorizedRequest: processUnauthorizedRequest,
    handleError: handleError,
    getId: getId
};
