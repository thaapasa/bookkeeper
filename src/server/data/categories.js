"use strict";

const db = require("./db");

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

module.exports = {
    getAll: getAll
};
