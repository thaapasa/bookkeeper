import { ITask } from 'pg-promise';

import { Email, Group, NotFoundError, ObjectId, User } from 'shared/types';
import { UserDataUpdate } from 'shared/userData';
import { profileImagePath } from 'server/content/ProfileImage';

export type RawUserData = Record<string, any>;

export function dbRowToUser(user: RawUserData): User {
  return {
    ...(user as User),
    image: profileImagePath(user.image, user.email, 'small'),
    imageLarge: profileImagePath(user.image, user.email, 'large'),
  };
}

const select = /*sql*/ `
SELECT
  id, username, email, first_name as "firstName", last_name as "lastName", image
FROM users u`;

export async function getAllUsers(tx: ITask<any>, groupId: number): Promise<User[]> {
  const users = await tx.manyOrNone<RawUserData>(
    /*sql*/ `${select}
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
      WHERE id=$/userId/ AND
        (SELECT COUNT(*) FROM group_users
          WHERE user_id=u.id AND group_id=COALESCE($/groupId/, u.default_group_id)
        ) > 0`,
    { userId, groupId },
  );
  if (!user) {
    throw new NotFoundError('USER_NOT_FOUND', 'user', userId);
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
): Promise<RawUserData | undefined> {
  const user = await tx.oneOrNone<RawUserData>(
    `SELECT u.id,
        username, email, first_name as "firstName", last_name as "lastName",
        default_group_id as "defaultGroupId", image, g.id as "groupId", g.name as "groupName",
        go.default_source_id as "defaultSourceId"
      FROM users u
        LEFT JOIN group_users go ON (go.user_id = u.id AND go.group_id = COALESCE($/groupId/, u.default_group_id))
        LEFT JOIN groups g ON (g.id = go.group_id)
      WHERE username=$/username/ AND password=ENCODE(DIGEST($/password/, 'sha1'), 'hex')`,
    { username, password, groupId },
  );
  return user ?? undefined;
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

export async function updateProfileImageById(
  tx: ITask<any>,
  userId: ObjectId,
  filename: string,
): Promise<void> {
  await tx.none(`UPDATE users SET image=$/filename/ WHERE id=$/userId/`, { userId, filename });
}

export async function clearProfileImageById(tx: ITask<any>, userId: ObjectId): Promise<void> {
  await tx.none(`UPDATE users SET image=NULL WHERE id=$/userId/`, { userId });
}
