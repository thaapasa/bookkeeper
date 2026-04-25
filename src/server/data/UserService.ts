import { BkError, InvalidInputError, ObjectId } from 'shared/types';
import { PasswordUpdate, UserDataUpdate } from 'shared/userData';
import { profileImageHandler } from 'server/content/ProfileImage';
import { DbTask } from 'server/data/Db.ts';
import { logger } from 'server/Logger';
import { FileUploadResult, safeDeleteFile } from 'server/server/FileHandling';
import { withSpan } from 'server/telemetry/Spans';

import {
  clearProfileImageById,
  getUserByCredentials,
  getUserByEmail,
  getUserById,
  updateProfileImageById,
  updateUserDataById,
  updateUserPasswordById,
} from './UserDb';

export function updateUserData(
  tx: DbTask,
  groupId: ObjectId,
  userId: ObjectId,
  userData: UserDataUpdate,
) {
  return withSpan('user.update', { 'app.group_id': groupId, 'app.user_id': userId }, async () => {
    const user = await getUserById(tx, groupId, userId);
    if (userData.email !== user.email) {
      const otherUser = await getUserByEmail(tx, userData.email);
      if (otherUser) {
        throw new BkError('EMAIL_IN_USE', 'Email is already in use', 400);
      }
    }
    logger.info({ userId }, 'Updating user data');
    await updateUserDataById(tx, userId, userData);
  });
}

export function changeUserPassword(
  tx: DbTask,
  groupId: ObjectId,
  userId: ObjectId,
  passwordUpdate: PasswordUpdate,
) {
  return withSpan(
    'user.change_password',
    { 'app.group_id': groupId, 'app.user_id': userId },
    async () => {
      const user = await getUserById(tx, groupId, userId);
      const userByPw = await getUserByCredentials(
        tx,
        user.username,
        passwordUpdate.currentPassword,
      );
      if (!userByPw || user.id !== userByPw.id) {
        throw new InvalidInputError('INVALID_CURRENT_PASSWORD', 'Current password is invalid');
      }

      logger.info(`Updating password for user ${userId}`);
      await updateUserPasswordById(tx, userId, passwordUpdate.newPassword);
    },
  );
}

export function uploadProfileImage(
  tx: DbTask,
  groupId: ObjectId,
  userId: ObjectId,
  image: FileUploadResult,
) {
  return withSpan(
    'user.upload_profile_image',
    { 'app.group_id': groupId, 'app.user_id': userId },
    async () => {
      try {
        logger.info(image, `Updating profile image for user ${userId}`);
        const filename = await profileImageHandler.saveImages(image);
        await deleteProfileImage(tx, groupId, userId);
        await updateProfileImageById(tx, userId, filename);
        logger.info(`Profile image updated`);
      } finally {
        await safeDeleteFile(image.filepath);
      }
    },
  );
}

export function deleteProfileImage(tx: DbTask, groupId: ObjectId, userId: ObjectId) {
  return withSpan(
    'user.delete_profile_image',
    { 'app.group_id': groupId, 'app.user_id': userId },
    async () => {
      const user = await getUserById(tx, groupId, userId);
      if (!user.image) {
        logger.info(`No profile image for user, skipping delete`);
        return;
      }
      logger.info(`Deleting profile image for user ${userId}`);
      await profileImageHandler.deleteImages(user.image);
      await clearProfileImageById(tx, userId);
      logger.info(`Profile image deleted`);
    },
  );
}
