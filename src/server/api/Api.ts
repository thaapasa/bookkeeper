import debug from 'debug';
import { Router } from 'express';

import { ApiStatus } from 'shared/types/Api';
import { Source, User } from 'shared/types/Session';
import { toMoment } from 'shared/util/Time';

import { config } from '../Config';
import admin, { DbStatus } from '../data/admin/Admin';
import sources from '../data/Sources';
import users from '../data/Users';
import * as server from '../util/ServerUtil';
import { createCategoryApi } from './CategoryApi';
import { createExpenseApi } from './ExpenseApi';
import { createSessionApi } from './SessionApi';
import { createStatisticsApi } from './StatisticsApi';

const log = debug('bookkeeper:api');

export function createApi() {
  log('Registering API');

  const api = Router();

  api.use('/session', createSessionApi());
  api.use('/category', createCategoryApi());
  api.use('/expense', createExpenseApi());
  api.use('/statistics', createStatisticsApi());

  // GET /api/status
  api.get(
    '/status',
    server.processUnauthorizedRequest(
      async (): Promise<ApiStatus> => ({
        status: 'OK',
        timestamp: toMoment().format(),
        version: config.version,
        revision: config.revision,
        commitId: config.commitId,
        environment: config.environment,
      })
    )
  );

  // GET /api/user/list
  api.get(
    '/user/list',
    server.processRequest(
      (session): Promise<User[]> => users.getAll(session.group.id),
      true
    )
  );

  // GET /api/user/[userid]
  api.get(
    '/user/:id',
    server.processRequest(
      (session, req): Promise<User> =>
        users.getById(session.group.id, parseInt(req.params.id, 10)),
      true
    )
  );

  // GET /api/source/list
  api.get(
    '/source/list',
    server.processRequest(
      (session): Promise<Source[]> => sources.getAll(session.group.id),
      true
    )
  );
  // GET /api/source/:id
  api.get(
    '/source/:id',
    server.processRequest(
      (session, req): Promise<Source> =>
        sources.getById(session.group.id, parseInt(req.params.id, 10)),
      true
    )
  );

  // GET /api/admin/status
  api.get(
    '/admin/status',
    server.processRequest<DbStatus>(
      session => admin.getDbStatus(session.group.id),
      true
    )
  );

  api.all('/*', (req, res) => {
    log(`${req.path} not found`);
    res
      .status(404)
      .json({ error: `/api${req.path} not found`, code: 'NOT_FOUND' });
  });

  return api;
}
