"use strict";

const db = require("./db");
const errors = require("../util/errors");

function createCategoryObject(categories) {
    const res = [];
    const subs = {};
    categories.forEach(c => {
        if (c.parentId === null) {
            c.children = [];
            subs[c.id] = c;
            res.push(c);
        } else {
            subs[c.parentId].children.push(c);
        }
    });
    return res;
}

function getAll(tx) {
    return (groupId) => tx.queryList("categories.get_all", "SELECT id, parent_id, name FROM categories WHERE group_id=$1::INTEGER " +
        "ORDER BY (CASE WHEN parent_id IS NULL THEN 1 ELSE 0 END) DESC, parent_id ASC, name", [ groupId ])
        .then(createCategoryObject);
}

function create(tx) {
    return (groupId, data) => tx.insert("categories.create", "INSERT INTO categories (group_id, parent_id, name) "+
        "VALUES ($1::INTEGER, $2::INTEGER, $3) RETURNING id", [ groupId, data.parentId, data.name ]);
}

function getById(tx) {
    return (groupId, id) => tx.queryObject("categories.get_by_id",
        "SELECT id, parent_id, name FROM categories WHERE id=$1::INTEGER AND group_id=$2::INTEGER ",
        [ id, groupId ])
        .then(errors.undefinedToError(errors.NotFoundError, "CATEGORY_NOT_FOUND", "category"));
}

function update(groupId, categoryId, data) {
    return db.transaction(tx => getById(tx)(groupId, categoryId)
            .then(errors.undefinedToError(errors.NotFoundError, "CATEGORY_NOT_FOUND", "category"))
            .then(x => tx.update("categories.update",
                "UPDATE categories SET parent_id=$1::INTEGER, name=$2 WHERE id=$3::INTEGER AND group_id=$4::INTEGER",
                [data.parentId || null, data.name, categoryId, groupId]))
            .then(x => ({ id: categoryId, parentId: data.parentId || null, name: data.name })), false);
}

module.exports = {
    getAll: getAll(db),
    getById: getById(db),
    create: create(db),
    update: update,
    tx: {
        getAll: getAll,
        getById: getById
    }
};
