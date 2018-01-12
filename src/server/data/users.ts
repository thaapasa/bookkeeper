import { db } from './db';
import * as errors from '../util/errors';
import { config } from '../config';

function mapUser(user) {
    user.image = user.image ? `img/users/${user.image}` : undefined;
    return user;
}

function getAll(tx) {
    return (groupId) => tx.queryList("users.get_all",
        "SELECT id, username, email, first_name, last_name, image FROM users WHERE " +
        "(SELECT COUNT(*) FROM group_users WHERE user_id=users.id AND group_id=$1::INTEGER) > 0", [groupId])
        .then(errors.undefinedToError(errors.NotFoundError, "USER_NOT_FOUND", "user"))
        .then(l => l.map(mapUser));
}

function getById(tx) {
    return (groupId, userId) => tx.queryObject("users.get_by_id",
        "SELECT id, username, email, first_name, last_name, image FROM users u WHERE id=$1::INTEGER AND "+
        "(SELECT COUNT(*) FROM group_users WHERE user_id=u.id AND group_id=COALESCE($2, u.default_group_id)) > 0", [userId, groupId])
        .then(errors.undefinedToError(errors.NotFoundError, "USER_NOT_FOUND", "user"))
        .then(mapUser);
}

function getGroups(tx) {
    return (userId) => tx.queryList("users.get_groups",
        "SELECT id, name FROM groups WHERE id IN (SELECT group_id FROM group_users WHERE user_id=$1)", [userId], i => i);
}

function getByCredentials(tx) {
    return (username, password, groupId) => tx.queryObject("users.get_by_credentials",
        "SELECT u.id, username, email, first_name, last_name, default_group_id, image, g.id as group_id, g.name as group_name, go.default_source_id FROM users u " +
        "LEFT JOIN group_users go ON (go.user_id = u.id AND go.group_id = COALESCE($3, u.default_group_id)) " +
        "LEFT JOIN groups g ON (g.id = go.group_id) " +
        "WHERE username=$1 AND password=ENCODE(DIGEST($2, 'sha1'), 'hex')",
        [ username, password, groupId ]
    ).then(errors.undefinedToError(errors.AuthenticationError, "INVALID_CREDENTIALS", "Invalid username or password"))
        .then(mapUser);
}

export default {
    getAll: getAll(db),
    getById: getById(db),
    getGroups: getGroups(db),
    getByCredentials: getByCredentials(db),
    tx: {
        getAll: getAll,
        getById: getById,
        getGroups: getGroups,
        getByCredentials: getByCredentials
    }
};
