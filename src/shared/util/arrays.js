"use strict";

const util = require("./util");

// https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle
function shuffle(a) {
    const n = a.length;
    for (let i = 0; i < n - 1; i++) {
        const j = util.getRandomInt(0, n - i);
        // Swap a[i] and a[i + j]
        const s = a[i];
        a[i] = a[i + j];
        a[i + j] = s;
    }
    return a;
}

module.exports = {
    shuffle: shuffle
};
