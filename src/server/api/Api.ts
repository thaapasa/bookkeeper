import { Router } from 'express';

import { toDayjs } from 'shared/time';
import { ApiStatus, DbStatus, User } from 'shared/types';
import { getAllUsers, getUserById } from 'server/data/UserDb';
import { logger } from 'server/Logger';
import { createErrorHandler } from 'server/server/ErrorHandler';
import { Requests } from 'server/server/RequestHandling';

import { config } from '../Config';
import { getDbStatus } from '../data/admin/Admin';
import { createCategoryApi } from './CategoryApi';
import { createExpenseApi } from './ExpenseApi';
import { createGroupingApi } from './GroupingApi';
import { createProfileApi } from './ProfileApi';
import { createReceiverApi } from './ReceiverApi';
import { createReportApi } from './ReportApi';
import { createSessionApi } from './SessionApi';
import { createSourceApi } from './SourceApi';
import { createStatisticsApi } from './StatisticsApi';
import { createSubscriptionApi } from './SubscriptionApi';
import { createTrackingApi } from './TrackingApi';

export function createApi() {
  logger.info('Registering API');

  const api = Router();

  // Attach subrouters
  api.use('/session', createSessionApi());
  api.use('/profile', createProfileApi());
  api.use('/category', createCategoryApi());
  api.use('/expense', createExpenseApi());
  api.use('/subscription', createSubscriptionApi());
  api.use('/statistics', createStatisticsApi());
  api.use('/source', createSourceApi());
  api.use('/receiver', createReceiverApi());
  api.use('/report', createReportApi());
  api.use('/tracking', createTrackingApi());
  api.use('/grouping', createGroupingApi());

  // GET /api/status
  api.get(
    '/status',
    Requests.unauthorizedRequest(
      async (): Promise<ApiStatus> => ({
        status: 'OK',
        timestamp: toDayjs().format(),
        version: config.version,
        revision: config.revision,
        commitId: config.commitId,
        environment: config.environment,
      }),
    ),
  );

  // GET /api/user/list
  api.get(
    '/user/list',
    Requests.txRequest((tx, session): Promise<User[]> => getAllUsers(tx, session.group.id), true),
  );

  // GET /api/user/[userid]
  api.get(
    '/user/:id',
    Requests.txRequest(
      (tx, session, req): Promise<User> =>
        getUserById(tx, session.group.id, parseInt(req.params.id, 10)),
      true,
    ),
  );

  // GET /api/admin/status
  api.get(
    '/admin/status',
    Requests.txRequest<DbStatus>((tx, session) => getDbStatus(tx, session.group.id), true),
  );

  // Return 404 for non-matched /api paths
  api.all('/*', (req, res) => {
    logger.warn(`Request ${req.method} ${req.path} not mapped -> 404`);
    res.status(404).json({
      error: `${req.method} /api${req.path} not mapped`,
      code: 'NOT_FOUND',
    });
  });

  // Handle errors
  api.use(createErrorHandler());

  return api;
}
