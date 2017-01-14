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

function sortAndCompareElements(ar1, ar2) {
    if (ar1.length != ar2.length) return false;
    ar2.sort();
    return ar1.sort().map((a, i) => a === ar2[i]).find(i => i == false) === undefined;
}

function indices(num) {
    return Array.apply(null, {length: num}).map(Number.call, Number);
}

module.exports = {
    shuffle: shuffle,
    sortAndCompareElements: sortAndCompareElements,
    indices: indices
};
