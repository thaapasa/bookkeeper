"use strict";

const moment = require("moment");

function timestamp() {
    return moment().format("YYYY-MM-DD hh:mm:ss");
}

function debug() {
    const args = [timestamp(), "[DEBUG]"].concat(Array.prototype.slice.call(arguments));
    console.log.apply(console, args);
}

function info() {
    const args = [timestamp(), "[INFO ]"].concat(Array.prototype.slice.call(arguments));
    console.log.apply(console, args);
}

function warn() {
    const args = [timestamp(), "[WARN ]"].concat(Array.prototype.slice.call(arguments));
    console.log.apply(console, args);
}

function error() {
    const args = [timestamp(), "[ERROR]"].concat(Array.prototype.slice.call(arguments));
    console.log.apply(console, args);
}

const log = {
    debug: debug,
    info: info,
    warn: warn,
    error: error
};

module.exports = log;
