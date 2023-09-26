import { ITask } from 'pg-promise';

import { BkError, InvalidInputError, ObjectId } from 'shared/types';
import { PasswordUpdate, toUserData, UserDataUpdate } from 'shared/userData';
import { profileImageHandler } from 'server/content/ProfileImage';
import { logger } from 'server/Logger';
import { FileUploadResult, safeDeleteFile } from 'server/server/FileHandling';

import {
  clearProfileImageById,
  getUserByCredentials,
  getUserByEmail,
  getUserById,
  updateProfileImageById,
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

export async function uploadProfileImage(
  tx: ITask<any>,
  groupId: ObjectId,
  userId: ObjectId,
  image: FileUploadResult,
) {
  try {
    logger.info(image, `Updating profile image for user ${userId}`);
    const filename = await profileImageHandler.saveImages(image);
    // Clear existing profile image
    await deleteProfileImage(tx, groupId, userId);
    await updateProfileImageById(tx, userId, filename);
    logger.info(`Profile image updated`);
  } finally {
    // Clear uploaded image
    await safeDeleteFile(image.filepath);
  }
}

export async function deleteProfileImage(tx: ITask<any>, groupId: ObjectId, userId: ObjectId) {
  const user = await getUserById(tx, groupId, userId);
  if (!user.image) {
    logger.info(`No profile image for user, skipping delete`);
    return;
  }
  logger.info(`Deleting profile image for user ${userId}`);
  await profileImageHandler.deleteImages(user.image);
  await clearProfileImageById(tx, userId);
  logger.info(`Profile image deleted`);
}
