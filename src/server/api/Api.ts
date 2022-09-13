import debug from 'debug';
import { Router } from 'express';

import { ApiStatus } from 'shared/types/Api';
import { User } from 'shared/types/Session';
import { toMoment } from 'shared/util/Time';
import { UserDb } from 'server/data/UserDb';
import { createErrorHandler } from 'server/server/ErrorHandler';
import { Requests } from 'server/server/RequestHandling';

import { config } from '../Config';
import { AdminDb, DbStatus } from '../data/admin/Admin';
import { createCategoryApi } from './CategoryApi';
import { createExpenseApi } from './ExpenseApi';
import { createReceiverApi } from './ReceiverApi';
import { createSessionApi } from './SessionApi';
import { createSourceApi } from './SourceApi';
import { createStatisticsApi } from './StatisticsApi';

const log = debug('bookkeeper:api');

export function createApi() {
  log('Registering API');

  const api = Router();

  // Attach subrouters
  api.use('/session', createSessionApi());
  api.use('/category', createCategoryApi());
  api.use('/expense', createExpenseApi());
  api.use('/statistics', createStatisticsApi());
  api.use('/source', createSourceApi());
  api.use('/receiver', createReceiverApi());

  // GET /api/status
  api.get(
    '/status',
    Requests.unauthorizedRequest(
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
    Requests.txRequest(
      (tx, session): Promise<User[]> => UserDb.getAll(tx, session.group.id),
      true
    )
  );

  // GET /api/user/[userid]
  api.get(
    '/user/:id',
    Requests.txRequest(
      (tx, session, req): Promise<User> =>
        UserDb.getById(tx, session.group.id, parseInt(req.params.id, 10)),
      true
    )
  );

  // GET /api/admin/status
  api.get(
    '/admin/status',
    Requests.txRequest<DbStatus>(
      (tx, session) => AdminDb.getDbStatus(tx, session.group.id),
      true
    )
  );

  // Return 404 for non-matched /api paths
  api.all('/*', (req, res) => {
    log(`Request ${req.method} ${req.originalUrl} not mapped -> 404`);
    res.status(404).json({
      error: `${req.method} /api${req.originalUrl} not mapped`,
      code: 'NOT_FOUND',
    });
  });

  // Handle errors
  api.use(createErrorHandler());

  return api;
}
