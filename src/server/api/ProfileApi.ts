import { Router } from 'express';

import { PasswordUpdate, UserDataUpdate } from 'shared/userData';
import { changeUserPassword, updateUserData, uploadProfileImage } from 'server/data/UserService';
import { logger } from 'server/Logger';
import { processFileUpload } from 'server/server/FileHandling';
import { createValidatingRouter } from 'server/server/ValidatingRouter';

/**
 * Creates profile API router.
 * Assumed attach path: `/api/profile`
 */
export function createProfileApi() {
  const api = createValidatingRouter(Router());

  // PUT /api/profile/userData
  api.putTx('/userData', { body: UserDataUpdate }, (tx, session, { body }) =>
    updateUserData(tx, session.group.id, session.user.id, body),
  );

  // PUT /api/profile/password
  api.putTx('/password', { body: PasswordUpdate }, (tx, session, { body }) =>
    changeUserPassword(tx, session.group.id, session.user.id, body),
  );

  api.postTx(
    '/image/:filename',
    {},
    processFileUpload('filename', async (tx, session, file) =>
      uploadProfileImage(tx, session.group.id, session.user.id, file),
    ),
  );

  api.delete('/image', {}, async (_tx, _session) => {
    logger.info('Delete profile image');
    return { status: 'OK' };
  });

  return api.router;
}
