"use strict";

const moment = require("moment");

const levels = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
};

let currentLevel = levels.debug;

function timestamp() {
    return moment().format("YYYY-MM-DD hh:mm:ss");
}

function debug() {
    if (currentLevel <= levels.debug) {
        const args = [timestamp(), "[DEBUG]"].concat(Array.prototype.slice.call(arguments));
        console.log.apply(console, args);
    }
}

function info() {
    if (currentLevel <= levels.info) {
        const args = [timestamp(), "[INFO ]"].concat(Array.prototype.slice.call(arguments));
        console.log.apply(console, args);
    }
}

function warn() {
    if (currentLevel <= levels.warn) {
        const args = [timestamp(), "[WARN ]"].concat(Array.prototype.slice.call(arguments));
        console.warn.apply(console, args);
    }
}

function error() {
    if (currentLevel <= levels.error) {
        const args = [timestamp(), "[ERROR]"].concat(Array.prototype.slice.call(arguments));
        console.error.apply(console, args);
    }
}

function setLevel(level) {
    info("Setting logging level to", level);
    currentLevel = levels[level];
}

const log = {
    debug: debug,
    info: info,
    warn: warn,
    error: error,
    setLevel: setLevel
};

module.exports = log;