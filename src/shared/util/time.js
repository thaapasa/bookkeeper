"use strict";

const moment = require("moment");

function month(year, month) {
    return moment({ year: year, month: month - 1, day: 1});
}

const datePattern = "YYYY-MM-DD";
function date(m) {
    return moment(m).format(datePattern);
}
function fromDate(str) {
    return moment(str, datePattern);
}

function iso(m) {
    return moment(m).format("YYYY-MM-DDTHH:mm:ssZ");
}

module.exports = {
    month: month,
    iso: iso,
    date: date,
    fromDate: fromDate
};
