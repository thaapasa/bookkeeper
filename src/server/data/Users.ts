import { db, DbAccess } from './Db';
import { User, Group } from '../../shared/types/session';
import { Map } from '../../shared/util/util';
import { NotFoundError, AuthenticationError } from '../../shared/types/errors';

export type RawUserData = Map<any>;

function mapUser(user: RawUserData): User {
    return { ...user as User, image: user.image ? `img/users/${user.image}` : undefined };
}

function getAll(tx: DbAccess) {
    return async (groupId: number): Promise<User[]> => {
        const users = await tx.queryList('users.get_all',
            'SELECT id, username, email, first_name, last_name, image FROM users WHERE ' +
            '(SELECT COUNT(*) FROM group_users WHERE user_id=users.id AND group_id=$1::INTEGER) > 0', [groupId]);
        if (users === undefined) { throw new NotFoundError('USER_NOT_FOUND', 'user'); }
        return users.map(mapUser);
    };
}

function getById(tx: DbAccess) {
    return async (groupId: number, userId: number): Promise<User> => {
        const user = await tx.queryObject('users.get_by_id',
            'SELECT id, username, email, first_name, last_name, image FROM users u WHERE id=$1::INTEGER AND ' +
            '(SELECT COUNT(*) FROM group_users WHERE user_id=u.id AND group_id=COALESCE($2, u.default_group_id)) > 0', [userId, groupId]);
        if (user === undefined) { throw new NotFoundError('USER_NOT_FOUND', 'user'); }
        return mapUser(user);
    };
}

function getGroups(tx: DbAccess) {
    return async (userId: number): Promise<Group[]> => {
        const group = await tx.queryList('users.get_groups',
            'SELECT id, name FROM groups WHERE id IN (SELECT group_id FROM group_users WHERE user_id=$1)', [userId]);
        return group as Group[];
    };
}

function getByCredentials(tx: DbAccess) {
    return async (username: string, password: string, groupId: number): Promise<User> => {
        const user = await tx.queryObject('users.get_by_credentials',
            'SELECT u.id, username, email, first_name, last_name, default_group_id, image, g.id as group_id, g.name as group_name, go.default_source_id FROM users u ' +
            'LEFT JOIN group_users go ON (go.user_id = u.id AND go.group_id = COALESCE($3, u.default_group_id)) ' +
            'LEFT JOIN groups g ON (g.id = go.group_id) ' +
            "WHERE username=$1 AND password=ENCODE(DIGEST($2, 'sha1'), 'hex')",
            [username, password, groupId]);
        if (user === undefined) { throw new AuthenticationError('INVALID_CREDENTIALS', 'Invalid username or password'); }
        return mapUser(user);
    };
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
