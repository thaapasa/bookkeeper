var moment = require("moment");

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

export function debug(...message: any[]) {
    if (currentLevel <= levels.debug) {
        const args = [timestamp(), "[DEBUG]"].concat(message);
        console.log.apply(console, args);
    }
}

export function info(...message: any[]) {
    if (currentLevel <= levels.info) {
        const args = [timestamp(), "[INFO ]"].concat(message);
        console.log.apply(console, args);
    }
}

export function warn(...message: any[]) {
    if (currentLevel <= levels.warn) {
        const args = [timestamp(), "[WARN ]"].concat(message);
        console.warn.apply(console, args);
    }
}

export function error(...message: any[]) {
    if (currentLevel <= levels.error) {
        const args = [timestamp(), "[ERROR]"].concat(message);
        console.error.apply(console, args);
    }
}

export function setLevel(level: string, reportChange?: boolean): string {
    const oldLevel = currentLevel;
    const oldLevelName: string = Object.keys(levels).find(k => levels[k] === oldLevel) || 'debug';

    var levelNum = levels[level];
    if (reportChange !== false) {
        info("Setting logging level to", level, "=", levelNum, "; was", oldLevelName);
    }

    currentLevel = levelNum;
    return oldLevelName;
}

export function suppressFor(fun) {
    var level = setLevel('error', false);
    return Promise.resolve(fun())
        .then(x => { setLevel(level); return x; })
        .catch(e => { setLevel(level); throw e; })
}
