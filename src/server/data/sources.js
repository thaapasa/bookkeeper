"use strict";

const db = require("./db");

function createGroupObject(rows) {
    if (!rows || rows.size < 1) return rows;
    return rows.reduce((list, v) => {
        if ((list[list.length - 1] ? list[list.length - 1].id : undefined) !== v.id) {
            list.push({ id: v.id, name: v.name, shares: v.shares, users: [] });
        }
        list[list.length - 1].users.push({ userid: v.userid, share: v.share });
        return list;
    }, []);
}

function getAll(groupid, userid) {
    return db.queryList("sources.getAll",
        "SELECT s.id, s.groupid, name, (SELECT SUM(share) FROM source_users WHERE sourceid = s.id)::INTEGER AS shares, so.userid, so.share " +
        "FROM sources s " +
        "LEFT JOIN source_users so ON (so.sourceid = s.id) " +
        "WHERE groupid = $1::INTEGER", [ groupid ])
        .then(createGroupObject);
}


module.exports = {
    getAll: getAll
};
