"use strict";

const db = require("./db");
const errors = require("../util/errors");

function createCategoryObject(categories) {
    const res = [];
    const subs = {};
    categories.forEach(c => {
        if (c.parentid === null) {
            c.children = [];
            subs[c.id] = c;
            res.push(c);
        } else {
            subs[c.parentid].children.push(c);
        }
    });
    return res;
}

function getAll(groupid) {
    return db.queryList("categories.getAll", "SELECT id, parentid, name FROM categories WHERE groupid=$1::INTEGER " +
        "ORDER BY (CASE WHEN parentid IS NULL THEN 1 ELSE 0 END) DESC, parentid ASC, name", [ groupid ])
        .then(createCategoryObject);
}

function getById(groupid, id) {
    return db.queryObject("categories.getById",
        "SELECT id, parentid, name FROM categories WHERE id=$1::INTEGER AND groupid=$2::INTEGER ",
        [ id, groupid ])
        .then(errors.undefinedToError(errors.NotFoundError, "CATEGORY_NOT_FOUND", "category"));
}

module.exports = {
    getAll: getAll,
    getById: getById
};
