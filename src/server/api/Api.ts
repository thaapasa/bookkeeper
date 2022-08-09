import debug from 'debug';
import { Router } from 'express';
import * as t from 'io-ts';

import { ApiMessage, ApiStatus } from 'shared/types/Api';
import {
  Category,
  CategoryAndTotals,
  Group,
  Session,
  SessionBasicInfo,
  Source,
  User,
} from 'shared/types/Session';
import { validate } from 'shared/types/Validator';
import { TISODate, toMoment } from 'shared/util/Time';
import { optNumber } from 'shared/util/Util';

import { config } from '../Config';
import admin, { DbStatus } from '../data/admin/Admin';
import categories, { CategoryInput } from '../data/Categories';
import sessions from '../data/Sessions';
import sources from '../data/Sources';
import users from '../data/Users';
import * as server from '../util/ServerUtil';
import { Schema, Validator as V } from '../util/Validator';
import { createExpenseApi } from './ExpenseApi';

const log = debug('bookkeeper:api');

export function createApi() {
  log('Registering API');

  const app = Router();
  // GET /api/status
  app.get(
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

  // PUT /api/session
  app.put(
    '/session',
    server.processUnauthorizedRequest(
      (req): Promise<Session> =>
        sessions.login(
          req.body.username,
          req.body.password,
          optNumber(req.query.groupId)
        )
    )
  );
  app.put(
    '/session/refresh',
    server.processUnauthorizedRequest(
      (req): Promise<Session> =>
        sessions.refresh(server.getToken(req), optNumber(req.query.groupId))
    )
  );

  // GET /api/session
  app.get(
    '/session',
    server.processRequest(
      (session): Promise<Session> => sessions.appendInfo(session)
    )
  );
  app.get(
    '/session/bare',
    server.processRequest(async (session): Promise<SessionBasicInfo> => session)
  );

  // DELETE /api/session
  app.delete(
    '/session',
    server.processRequest(
      (session): Promise<ApiMessage> => sessions.logout(session)
    )
  );

  // GET /api/session/groups
  app.get(
    '/session/groups',
    server.processRequest(
      (session): Promise<Group[]> => users.getGroups(session.user.id)
    )
  );

  // GET /api/user/list
  app.get(
    '/user/list',
    server.processRequest(
      (session): Promise<User[]> => users.getAll(session.group.id),
      true
    )
  );

  // GET /api/user/[userid]
  app.get(
    '/user/:id',
    server.processRequest(
      (session, req): Promise<User> =>
        users.getById(session.group.id, parseInt(req.params.id, 10)),
      true
    )
  );

  // GET /api/category/list
  app.get(
    '/category/list',
    server.processRequest(
      (session): Promise<Category[]> => categories.getAll(session.group.id),
      true
    )
  );

  // PUT /api/category
  const categorySchema: Schema<CategoryInput> = {
    name: V.stringWithLength(1, 255),
    parentId: V.nonNegativeInt,
  };
  app.put(
    '/category',
    server.processRequest(async (session, req): Promise<ApiMessage> => {
      const id = await categories.create(
        session.group.id,
        V.validate(categorySchema, req.body)
      );
      return { status: 'OK', message: 'Category created', categoryId: id };
    }, true)
  );

  const DateRange = t.type({
    startDate: TISODate,
    endDate: TISODate,
  });

  // GET /api/category/totals
  app.get(
    '/category/totals',
    server.processRequest((session, req): Promise<CategoryAndTotals[]> => {
      const params = validate(DateRange, req.query);
      return categories.getTotals(session.group.id, params);
    }, true)
  );

  // POST /api/category/categoryId
  app.post(
    '/category/:id',
    server.processRequest(
      (session, req): Promise<Category> =>
        categories.update(
          session.group.id,
          parseInt(req.params.id, 10),
          V.validate(categorySchema, req.body)
        ),
      true
    )
  );

  // GET /api/category/categoryId
  app.get(
    '/category/:id',
    server.processRequest(
      (session, req): Promise<Category> =>
        categories.getById(session.group.id, parseInt(req.params.id, 10)),
      true
    )
  );

  // DELETE /api/category/categoryId
  app.delete(
    '/category/:id',
    server.processRequest(
      (session, req): Promise<ApiMessage> =>
        categories.remove(session.group.id, parseInt(req.params.id, 10)),
      true
    )
  );

  // GET /api/source/list
  app.get(
    '/source/list',
    server.processRequest(
      (session): Promise<Source[]> => sources.getAll(session.group.id),
      true
    )
  );
  // GET /api/source/:id
  app.get(
    '/source/:id',
    server.processRequest(
      (session, req): Promise<Source> =>
        sources.getById(session.group.id, parseInt(req.params.id, 10)),
      true
    )
  );

  app.use('/expense', createExpenseApi());

  // GET /api/admin/status
  app.get(
    '/admin/status',
    server.processRequest<DbStatus>(
      session => admin.getDbStatus(session.group.id),
      true
    )
  );

  app.all('/*', (req, res) => {
    log(`${req.path} not found`);
    res
      .status(404)
      .json({ error: `/api${req.path} not found`, code: 'NOT_FOUND' });
  });

  return app;
}
