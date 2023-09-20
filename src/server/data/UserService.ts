import { ITask } from 'pg-promise';

import { BkError, InvalidInputError, ObjectId } from 'shared/types';
import { PasswordUpdate, toUserData, UserDataUpdate } from 'shared/userData';
import { logger } from 'server/Logger';

import {
  getUserByCredentials,
  getUserByEmail,
  getUserById,
  updateUserDataById,
  updateUserPasswordById,
} from './UserDb';

export async function updateUserData(
  tx: ITask<any>,
  groupId: ObjectId,
  userId: ObjectId,
  userData: UserDataUpdate,
) {
  const user = await getUserById(tx, groupId, userId);
  if (userData.email !== user.email) {
    // Check for email update
    const otherUser = await getUserByEmail(tx, userData.email);
    if (otherUser) {
      throw new BkError('EMAIL_IN_USE', 'Email is already in use', 400);
    }
  }
  logger.info({ from: toUserData(user), to: userData }, `Updating user data for user ${userId}`);
  await updateUserDataById(tx, userId, userData);
}

export async function changeUserPassword(
  tx: ITask<any>,
  groupId: ObjectId,
  userId: ObjectId,
  passwordUpdate: PasswordUpdate,
) {
  const user = await getUserById(tx, groupId, userId);
  const userByPw = await getUserByCredentials(tx, user.username, passwordUpdate.currentPassword);
  if (!userByPw || user.id !== userByPw.id) {
    throw new InvalidInputError('INVALID_CURRENT_PASSWORD', 'Current password is invalid');
  }

  logger.info(`Updating password for user ${userId}`);
  await updateUserPasswordById(tx, userId, passwordUpdate.newPassword);
}
