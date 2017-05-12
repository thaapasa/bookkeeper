"use strict";

const log = require("./../shared/util/log");
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const config = require("./config");
const api = require("./api");
const path = require('path');
const curDir = process.cwd();

log.setLevel(config.logLevel);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static("public"));

api.registerAPI(app);
app.get(/\/p\/.*/, (s, r) => r.sendFile(path.join(curDir + "/public/index.html")));

try {
    app.listen(config.port, () => {
        log.info("Kukkaro server started with configuration", config);
    });
} catch (er) {
    log.error(er);
}
