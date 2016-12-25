"use strict";

const moment = require("moment");

function month(year, month) {
    return moment({ year: year, month: month - 1, day: 1});
}

function iso(m) {
    return m.format("YYYY-MM-DDTHH:mm:ssZ");
}

module.exports = {
    month: month,
    iso: iso
};
