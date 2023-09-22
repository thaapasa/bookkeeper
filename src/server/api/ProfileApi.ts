import { Router } from 'express';

import { PasswordUpdate, UserDataUpdate } from 'shared/userData';
import {
  changeUserPassword,
  deleteProfileImage,
  updateUserData,
  uploadProfileImage,
} from 'server/data/UserService';
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
    processFileUpload('filename', (tx, session, file) =>
      uploadProfileImage(tx, session.group.id, session.user.id, file),
    ),
  );

  api.deleteTx('/image', {}, (tx, session) =>
    deleteProfileImage(tx, session.group.id, session.user.id),
  );

  return api.router;
}
