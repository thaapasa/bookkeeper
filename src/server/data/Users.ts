import { db } from './Db';
import { User, Group } from '../../shared/types/Session';
import { NotFoundError, AuthenticationError } from '../../shared/types/Errors';
import { IBaseProtocol } from 'pg-promise';

export type RawUserData = Record<string, any>;

export function mapUser(user: RawUserData): User {
  return {
    ...(user as User),
    image: user.image ? `img/users/${user.image}` : undefined,
  };
}

const select = `
SELECT
  id, username, email, first_name as "firstName", last_name as "lastName", image
FROM users u`;

function getAll(tx: IBaseProtocol<any>) {
  return async (groupId: number): Promise<User[]> => {
    const users = await tx.manyOrNone<RawUserData>(
      `
${select}
WHERE
  (SELECT COUNT(*) FROM group_users WHERE user_id=u.id AND group_id=$/groupId/::INTEGER) > 0`,
      { groupId }
    );
    if (!users || users.length < 1) {
      throw new NotFoundError('USER_NOT_FOUND', 'user');
    }
    return users.map(mapUser);
  };
}

function getById(tx: IBaseProtocol<any>) {
  return async (groupId: number, userId: number): Promise<User> => {
    const user = await tx.oneOrNone<RawUserData>(
      `
${select}
WHERE id=$/userId/::INTEGER AND
  (SELECT COUNT(*) FROM group_users WHERE user_id=u.id AND group_id=COALESCE($/groupId/, u.default_group_id)) > 0`,
      { userId, groupId }
    );
    if (!user) {
      throw new NotFoundError('USER_NOT_FOUND', 'user');
    }
    return mapUser(user);
  };
}

function getGroups(tx: IBaseProtocol<any>) {
  return async (userId: number): Promise<Group[]> => {
    const groups = await tx.manyOrNone<Group>(
      `
SELECT
  id, name
FROM groups
WHERE id IN (SELECT group_id FROM group_users WHERE user_id=$/userId/)`,
      { userId }
    );
    return groups;
  };
}

function getByCredentials(tx: IBaseProtocol<any>) {
  return async (
    username: string,
    password: string,
    groupId: number
  ): Promise<RawUserData> => {
    const user = await tx.oneOrNone<RawUserData>(
      `
SELECT
  u.id, username, email, first_name as "firstName", last_name as "lastName",
  default_group_id as "defaultGroupId", image, g.id as "groupId", g.name as "groupName",
  go.default_source_id as "defaultSourceId"
FROM users u
  LEFT JOIN group_users go ON (go.user_id = u.id AND go.group_id = COALESCE($/groupId/, u.default_group_id))
  LEFT JOIN groups g ON (g.id = go.group_id)
WHERE username=$/username/ AND password=ENCODE(DIGEST($/password/, 'sha1'), 'hex')`,
      { username, password, groupId }
    );
    if (!user) {
      throw new AuthenticationError(
        'INVALID_CREDENTIALS',
        'Invalid username or password'
      );
    }
    return user;
  };
}

export default {
  getAll: getAll(db),
  getById: getById(db),
  getGroups: getGroups(db),
  getByCredentials: getByCredentials(db),
  tx: {
    getAll,
    getById,
    getGroups,
    getByCredentials,
  },
};
