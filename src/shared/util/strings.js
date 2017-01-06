"use strict";

function ucFirst(str) {
    return typeof str === "string" && str.length > 0 ? (str.charAt(0).toUpperCase() + str.substr(1)) : str;
}

function underscoreToCamelCase(str) {
    if (typeof str !== "string" || str.length < 2) return str;
    return str.split("_").map((v, i) => (i === 0) ? v : ucFirst(v)).join("");
}

module.exports = {
    ucFirst: ucFirst,
    underscoreToCamelCase: underscoreToCamelCase
};
