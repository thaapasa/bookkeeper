"use strict";

module.exports = {};

module.exports.ucFirst = function(str) {
    return typeof str === "string" && str.length > 0 ? (str.charAt(0).toUpperCase() + str.substr(1)) : str;
};
