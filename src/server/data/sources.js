"use strict";

const db = require("./db");

function createGroupObject(rows) {
    if (!rows || rows.size < 1) return rows;
    return rows.reduce((list, v) => {
        if ((list[list.length - 1] ? list[list.length - 1].id : undefined) !== v.id) {
            list.push({ id: v.id, name: v.name, shares: v.shares, users: [] });
        }
        list[list.length - 1].users.push({ id: v.userId, share: v.share });
        return list;
    }, []);
}

function getAll(groupId) {
    return db.queryList("sources.get_all",
        "SELECT s.id, s.group_id, name, (SELECT SUM(share) FROM source_users WHERE source_id = s.id)::INTEGER AS shares, so.user_id, so.share " +
        "FROM sources s " +
        "LEFT JOIN source_users so ON (so.source_id = s.id) " +
        "WHERE group_id = $1::INTEGER", [ groupId ])
        .then(createGroupObject);
}


module.exports = {
    getAll: getAll
};
