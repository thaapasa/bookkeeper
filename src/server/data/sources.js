"use strict";

const db = require("./db");
const errors = require("../util/errors");

function createGroupObject(rows) {
    if (!rows || rows.size < 1) return undefined;
    return rows.reduce((list, v) => {
        if ((list[list.length - 1] ? list[list.length - 1].id : undefined) !== v.id) {
            list.push({ id: v.id, name: v.name, shares: v.shares, users: [] });
        }
        list[list.length - 1].users.push({ userId: v.userId, share: v.share });
        return list;
    }, []);
}

const select = "SELECT s.id, s.group_id, name, (SELECT SUM(share) FROM source_users WHERE source_id = s.id)::INTEGER AS shares, so.user_id, so.share " +
    "FROM sources s " +
    "LEFT JOIN source_users so ON (so.source_id = s.id) ";

function getAll(groupId) {
    return db.queryList("sources.get_all",
        `${select} WHERE group_id = $1::INTEGER`, [ groupId ])
        .then(createGroupObject);
}

function getById(groupId, id) {
    return db.queryList("sources.get_by_id",
        `${select} WHERE id=$1::INTEGER AND group_id=$2::INTEGER`, [ id, groupId ])
        .then(errors.emptyToError(errors.NotFoundError, "SOURCE_NOT_FOUND", "source"))
        .then(createGroupObject)
        .then(a => a[0]);
}


module.exports = {
    getAll: getAll,
    getById: getById
};
