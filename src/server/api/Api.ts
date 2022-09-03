import debug from 'debug';
import { Router } from 'express';

import { ApiStatus } from 'shared/types/Api';
import { Source, User } from 'shared/types/Session';
import { toMoment } from 'shared/util/Time';
import { SourceDb } from 'server/data/SourceDb';
import { UserDb } from 'server/data/UserDb';

import { config } from '../Config';
import { AdminDb, DbStatus } from '../data/admin/Admin';
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
    server.processTxRequest(
      (tx, session): Promise<User[]> => UserDb.getAll(tx, session.group.id),
      true
    )
  );

  // GET /api/user/[userid]
  api.get(
    '/user/:id',
    server.processTxRequest(
      (tx, session, req): Promise<User> =>
        UserDb.getById(tx, session.group.id, parseInt(req.params.id, 10)),
      true
    )
  );

  // GET /api/source/list
  api.get(
    '/source/list',
    server.processTxRequest(
      (tx, session): Promise<Source[]> => SourceDb.getAll(tx, session.group.id),
      true
    )
  );
  // GET /api/source/:id
  api.get(
    '/source/:id',
    server.processTxRequest(
      (tx, session, req): Promise<Source> =>
        SourceDb.getById(tx, session.group.id, parseInt(req.params.id, 10)),
      true
    )
  );

  // GET /api/admin/status
  api.get(
    '/admin/status',
    server.processTxRequest<DbStatus>(
      (tx, session) => AdminDb.getDbStatus(tx, session.group.id),
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
