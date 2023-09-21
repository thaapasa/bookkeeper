import { Router } from 'express';

import { PasswordUpdate, UserDataUpdate } from 'shared/userData';
import { changeUserPassword, updateUserData } from 'server/data/UserService';
import { logger } from 'server/Logger';
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

  api.postTx('/image/:filename', {}, async (_tx, session, { params }, req) => {
    logger.info('Image upload');
    await Bun.write(`uploads/${params.filename}`, req.body);
    logger.info('Image written');
    return { status: 'OK' };
  });

  return api.router;
}
