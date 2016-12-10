"use strict";

const db = require("./db-access");
const log = require("./util/log");
const moment = require("moment");
const express = require("express");
const app = express();
const bodyParser = require("body-parser");

const config = {
    showErrorCause: false
};

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

//var router = express.Router();

//app.use(router);
app.use(express.static("public"));

//app.all('/', function (req, res, next) {
//    log.info("Someone made a request!");
//    next();
//});

app.get("/api/isalive", function (req, res) {
    log.info("/isalive");
    res.json({ status: "OK", timestamp: moment().format() });
});

app.get("/api/user/list", function (req, res) {
    log.info("GET users");

    db.queryList("select id, email, firstname, lastname from users")
        .then(r => res.json(r))
        .catch(handleError(res));
});

const userPath = /\/api\/user\/([0-9]+)/;
app.get(userPath, function (req, res) {
    const userId = parseInt(userPath.exec(req.url)[1], 10);
    log.info(`GET user ${userId}`);
    db.queryObject("select * from users where id=$1", [userId])
        .then(r => res.json(r))
        .catch(handleError(res));
});

app.get("/api/expense/list", function (req, res) {
    log.info("GET expense/list");
    res.json({  });
});

/**
 * Store new expense paid by user
 * @param {string} user
 * @param {number} amount
 */
app.put("/api/expense", function (req, res) {
    log.info("PUT expense");
    log.debug(req.body);
    res.end('OK')
});

try {
    app.listen(3000, () => {
        log.info("Kukkaro server listening on port 3000!");
    });
} catch (er) {
    log.error(er);
}

function handleError(res) {
    return e => {
        const data = { type: "error", code: e.code || "INTERNAL_ERROR" };
        const status = typeof(res.status) == "number" ? res.status : 500;
        if (config.showErrorCause) {
            data.cause = e.cause || e;
        }
        res.status(status).json(data);
    }
}
