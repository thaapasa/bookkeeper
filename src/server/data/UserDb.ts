import { ITask } from 'pg-promise';

import { AuthenticationError, Email, Group, NotFoundError, ObjectId, User } from 'shared/types';
import { UserDataUpdate } from 'shared/userData';

export type RawUserData = Record<string, any>;

export function dbRowToUser(user: RawUserData): User {
  return {
    ...(user as User),
    image: user.image ? `img/users/${user.image}` : undefined,
  };
}

const select = `--sql
SELECT
  id, username, email, first_name as "firstName", last_name as "lastName", image,
  expense_shortcuts as "expenseShortcuts"
FROM users u`;

export async function getAllUsers(tx: ITask<any>, groupId: number): Promise<User[]> {
  const users = await tx.manyOrNone<RawUserData>(
    `${select}
      WHERE
        (SELECT COUNT(*) FROM group_users WHERE user_id=u.id AND group_id=$/groupId/::INTEGER) > 0`,
    { groupId },
  );
  if (!users || users.length < 1) {
    throw new NotFoundError('USER_NOT_FOUND', 'user');
  }
  return users.map(dbRowToUser);
}

export async function getUserById(tx: ITask<any>, groupId: number, userId: number): Promise<User> {
  const user = await tx.oneOrNone<RawUserData>(
    /*sql*/ `${select}
      WHERE id=$/userId/::INTEGER AND
        (SELECT COUNT(*) FROM group_users WHERE user_id=u.id AND group_id=COALESCE($/groupId/, u.default_group_id)) > 0`,
    { userId, groupId },
  );
  if (!user) {
    throw new NotFoundError('USER_NOT_FOUND', 'user');
  }
  return dbRowToUser(user);
}

export async function getGroupsForUser(tx: ITask<any>, userId: number): Promise<Group[]> {
  const groups = await tx.manyOrNone<Group>(
    `SELECT id, name
      FROM groups
      WHERE id IN (SELECT group_id FROM group_users WHERE user_id=$/userId/)`,
    { userId },
  );
  return groups;
}

export async function getUserByCredentials(
  tx: ITask<any>,
  username: string,
  password: string,
  groupId?: number,
): Promise<RawUserData> {
  const user = await tx.oneOrNone<RawUserData>(
    `SELECT u.id,
        username, email, first_name as "firstName", last_name as "lastName",
        default_group_id as "defaultGroupId", image, g.id as "groupId", g.name as "groupName",
        u.expense_shortcuts as "expenseShortcuts",
        go.default_source_id as "defaultSourceId"
      FROM users u
        LEFT JOIN group_users go ON (go.user_id = u.id AND go.group_id = COALESCE($/groupId/, u.default_group_id))
        LEFT JOIN groups g ON (g.id = go.group_id)
      WHERE username=$/username/ AND password=ENCODE(DIGEST($/password/, 'sha1'), 'hex')`,
    { username, password, groupId },
  );
  if (!user) {
    throw new AuthenticationError('INVALID_CREDENTIALS', 'Invalid username or password');
  }
  return user;
}

export async function getUserByEmail(
  tx: ITask<any>,
  email: Email,
): Promise<RawUserData | undefined> {
  const user = await tx.oneOrNone<RawUserData>(
    /*sql*/ `${select}
    WHERE email=$/email/`,
    { email },
  );
  return user ?? undefined;
}

export async function updateUserDataById(
  tx: ITask<any>,
  userId: ObjectId,
  userData: UserDataUpdate,
): Promise<void> {
  await tx.none(
    `UPDATE users
      SET first_name=$/firstName/, last_name=$/lastName/,
        username=$/username/, email=$/email/
      WHERE id=$/userId/`,
    {
      userId,
      firstName: userData.firstName,
      lastName: userData.lastName,
      username: userData.username,
      email: userData.email,
    },
  );
}

export async function updateUserPasswordById(
  tx: ITask<any>,
  userId: ObjectId,
  password: string,
): Promise<void> {
  await tx.none(
    `UPDATE users
      SET password=encode(digest($/password/, 'sha1'), 'hex')
      WHERE id=$/userId/`,
    { userId, password },
  );
}
