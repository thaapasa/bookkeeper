"use strict";

function ucFirst(str) {
    return typeof str === "string" && str.length > 0 ? (str.charAt(0).toUpperCase() + str.substr(1)) : str;
}

function underscoreToCamelCase(str) {
    if (typeof str !== "string" || str.length < 2) return str;
    return str.split("_").map((v, i) => (i === 0) ? v : ucFirst(v)).join("");
}

// Returns a random integer between min (included) and max (excluded)
// Using Math.round() will give you a non-uniform distribution!
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

module.exports = {
    ucFirst: ucFirst,
    underscoreToCamelCase: underscoreToCamelCase,
    getRandomInt: getRandomInt
};
