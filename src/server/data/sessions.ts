import { db, DbAccess } from './db';
import users, { RawUserData } from './users';
import sources from './sources';
import categories from './categories';
import { promisify } from 'util';
import { config } from '../config';
import { Session, SessionBasicInfo, User } from '../../shared/types/session';
import { Map } from '../../shared/util/util';
import { AuthenticationError } from '../../shared/types/errors';
import { ApiMessage } from '../../shared/types/api';
const debug = require('debug')('bookkeeper:api:sessions');

const randomBytes = promisify(require('crypto').randomBytes);

function createSessionInfo([ token, refreshToken ]: string[], userData: RawUserData, loginTime?: Date): SessionBasicInfo {
    return {
        token,
        refreshToken,
        user: {
            id: userData.id,
            username: userData.username,
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            defaultGroupId: userData.defaultGroupId,
        },
        group: {
            id: userData.groupId,
            name: userData.groupName,
            defaultSourceId: userData.defaultSourceId,
        },
        loginTime,
    };
}

function login(username: string, password: string, groupId: number): Promise<SessionBasicInfo> {
    debug('Login for', username);
    return db.transaction(async tx => {
        const user = await users.tx.getByCredentials(tx)(username, password, groupId);
        const tokens = await createSession(tx)(user);
        return createSessionInfo(tokens, user);
    });
}

function refresh(refreshToken: string, groupId: number): Promise<SessionBasicInfo> {
    debug('Refreshing session with', refreshToken);
    return db.transaction(async tx => {
        const sessionInfo = await getUserInfoByRefreshToken(tx)(refreshToken, groupId);
        const tokens = await createSession(tx)(sessionInfo);
        return createSessionInfo(tokens, sessionInfo);
    });
}

function logout(tx: DbAccess) {
    return async (session): Promise<ApiMessage> => {
        debug('Logout for', session.token);
        if (!session.token) {
            throw new AuthenticationError('INVALID_TOKEN', 'Session token is missing');
        }
        await tx.update('sessions.delete', 'DELETE FROM sessions WHERE (token=$1 AND refresh_token IS NOT NULL) ' +
            'OR (token=$2 AND refresh_token IS NULL)', [session.token, session.refreshToken]);
        return ({status: 'OK', message: 'User has logged out', userId: session.userId });
    };
}

function createSession(tx: DbAccess) {
    return async (user: RawUserData): Promise<string[]> => {
        const tokens = await Promise.all([ createToken(), createToken() ]);
        debug('User', user.email, 'logged in with token', tokens[0]);
        await tx.insert('sessions.create',
            'INSERT INTO sessions (token, refresh_token, user_id, login_time, expiry_time) VALUES '+
            '($1, $2, $3, NOW(), NOW() + $4::INTERVAL), '+
            '($2, NULL, $3, NOW(), NOW() + $5::INTERVAL)',
            [ tokens[0], tokens[1], user.id, config.sessionTimeout, config.refreshTokenTimeout]);
        return tokens;
    };
}

function purgeExpiredSessions(tx: DbAccess) {
    return (): Promise<number> => tx.update('sessions.purge', 'DELETE FROM sessions WHERE expiry_time <= NOW()');
}

const tokenSelect = 'SELECT s.token, s.refresh_token, s.user_id as id, s.login_time, u.username, u.email, u.first_name, u.last_name, u.default_group_id,' +
    'g.id AS group_id, g.name as group_name, go.default_source_id FROM sessions s '+
    'INNER JOIN users u ON (s.user_id = u.id) ' +
    'LEFT JOIN group_users go ON (go.user_id = u.id AND go.group_id = COALESCE($2, u.default_group_id)) ' +
    'LEFT JOIN groups g ON (g.id = go.group_id) ';

function getSession(tx: DbAccess) {
    return async (token: string, groupId: number): Promise<SessionBasicInfo> => {
        await purgeExpiredSessions(tx)();
        const userData = await tx.queryObject<RawUserData>('sessions.get_by_access_token',
            tokenSelect + 'WHERE s.token=$1 AND s.refresh_token IS NOT NULL AND s.expiry_time > NOW()', [token, groupId]);
        if (userData === undefined) {
            throw new AuthenticationError('INVALID_TOKEN', 'Access token is invalid', token);
        }
        await tx.update('sessions.update_expiry',
                'UPDATE sessions SET expiry_time=NOW() + $2::INTERVAL WHERE token=$1', [token, config.sessionTimeout]);
        return createSessionInfo([userData.token, userData.refreshToken], userData, userData.loginTime);
    };
}

function getUserInfoByRefreshToken(tx: DbAccess) {
    return async (token: string, groupId: number): Promise<RawUserData> => {
        await purgeExpiredSessions(tx)();
        const userData = await tx.queryObject<RawUserData>('sessions.get_by_refresh_token',
            tokenSelect + 'WHERE s.token=$1 AND s.refresh_token IS NULL AND s.expiry_time > NOW()', [token, groupId]);
        if (userData === undefined) {
            throw new AuthenticationError('INVALID_TOKEN', 'Refresh token is invalid', token);
        }
        await tx.update('sessions.purge_old_with_refresh', 'DELETE FROM sessions WHERE refresh_token=$1 OR token=$1', [token]);
        return userData;
    };
}

function appendInfo(tx: DbAccess) {
    return (session: SessionBasicInfo): Promise<Session> => Promise.all([
        users.tx.getGroups(tx)(session.user.id),
        sources.tx.getAll(tx)(session.group.id),
        categories.tx.getAll(tx)(session.group.id),
        users.tx.getAll(tx)(session.group.id)
    ]).then(a => ({ groups: a[0], sources: a[1], categories: a[2], users: a[3], ...session }));
}

async function createToken(): Promise<string> {
    const buf = await randomBytes(20);
    return buf.toString('hex');
}

export default {
    login: login,
    refresh: refresh,
    logout: logout(db),
    appendInfo: (session: SessionBasicInfo): Promise<Session> => db.transaction(tx => appendInfo(tx)(session), true),
    tx: {
        getSession: getSession,
        appendInfo: appendInfo
    }
};
