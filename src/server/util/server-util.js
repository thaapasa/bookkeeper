"use strict";

const log = require("./log");
const config = require("../config");

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

function processJson(handler) {
    return (req, res) => {
        log.debug(req.method, req.url);
        handler(req, res)
            .then(r => res.json(r))
            .catch(handleError(res));
    };
}

module.exports = {
    processJson: processJson,
    handleError: handleError
};
