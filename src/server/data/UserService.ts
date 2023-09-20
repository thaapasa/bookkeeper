import { ITask } from 'pg-promise';

import { BkError, ObjectId } from 'shared/types';
import { toUserData, UserDataUpdate } from 'shared/userData';
import { logger } from 'server/Logger';

import { getUserByEmail, getUserById, updateUserDataById } from './UserDb';

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
