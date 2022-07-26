import debug from 'debug';
import { Express } from 'express';
import * as t from 'io-ts';

import { ApiMessage, ApiStatus } from 'shared/types/Api';
import {
  Expense,
  ExpenseCollection,
  TExpenseQuery,
  TRecurringExpenseInput,
  TRecurringExpenseTarget,
  UserExpense,
  UserExpenseWithDetails,
} from 'shared/types/Expense';
import { ExpenseSplit } from 'shared/types/ExpenseSplit';
import {
  Category,
  CategoryAndTotals,
  Group,
  Session,
  SessionBasicInfo,
  Source,
  User,
} from 'shared/types/Session';
import {
  intStringBetween,
  NonEmptyArray,
  NumberString,
  stringWithLength,
  validate,
} from 'shared/types/Validator';
import { TISODate, toMoment } from 'shared/util/Time';
import { optNumber } from 'shared/util/Util';

import { config } from './Config';
import admin, { DbStatus } from './data/admin/Admin';
import categories, { CategoryInput } from './data/Categories';
import expenses from './data/Expenses';
import expenseSearch from './data/ExpenseSearch';
import sessions from './data/Sessions';
import sources from './data/Sources';
import users from './data/Users';
import * as server from './util/ServerUtil';
import { Schema, Validator as V } from './util/Validator';

const log = debug('bookkeeper:api');
const ExpenseIdType = t.type({ expenseId: NumberString });

export function registerAPI(app: Express) {
  log('Registering API');

  // GET /api/status
  app.get(
    '/api/status',
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
    '/api/session',
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
    '/api/session/refresh',
    server.processUnauthorizedRequest(
      (req): Promise<Session> =>
        sessions.refresh(server.getToken(req), optNumber(req.query.groupId))
    )
  );

  // GET /api/session
  app.get(
    '/api/session',
    server.processRequest(
      (session): Promise<Session> => sessions.appendInfo(session)
    )
  );
  app.get(
    '/api/session/bare',
    server.processRequest(async (session): Promise<SessionBasicInfo> => session)
  );

  // DELETE /api/session
  app.delete(
    '/api/session',
    server.processRequest(
      (session): Promise<ApiMessage> => sessions.logout(session)
    )
  );

  // GET /api/session/groups
  app.get(
    '/api/session/groups',
    server.processRequest(
      (session): Promise<Group[]> => users.getGroups(session.user.id)
    )
  );

  // GET /api/user/list
  app.get(
    '/api/user/list',
    server.processRequest(
      (session): Promise<User[]> => users.getAll(session.group.id),
      true
    )
  );

  // GET /api/user/[userid]
  app.get(
    '/api/user/:id',
    server.processRequest(
      (session, req): Promise<User> =>
        users.getById(session.group.id, parseInt(req.params.id, 10)),
      true
    )
  );

  // GET /api/category/list
  app.get(
    '/api/category/list',
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
    '/api/category',
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
    '/api/category/totals',
    server.processRequest((session, req): Promise<CategoryAndTotals[]> => {
      const params = validate(DateRange, req.query);
      return categories.getTotals(session.group.id, params);
    }, true)
  );

  // POST /api/category/categoryId
  app.post(
    '/api/category/:id',
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
    '/api/category/:id',
    server.processRequest(
      (session, req): Promise<Category> =>
        categories.getById(session.group.id, parseInt(req.params.id, 10)),
      true
    )
  );

  // DELETE /api/category/categoryId
  app.delete(
    '/api/category/:id',
    server.processRequest(
      (session, req): Promise<ApiMessage> =>
        categories.remove(session.group.id, parseInt(req.params.id, 10)),
      true
    )
  );

  // GET /api/source/list
  app.get(
    '/api/source/list',
    server.processRequest(
      (session): Promise<Source[]> => sources.getAll(session.group.id),
      true
    )
  );
  // GET /api/source/:id
  app.get(
    '/api/source/:id',
    server.processRequest(
      (session, req): Promise<Source> =>
        sources.getById(session.group.id, parseInt(req.params.id, 10)),
      true
    )
  );

  // GET /api/expense/list
  app.get(
    '/api/expense/list',
    server.processRequest(
      (session): Promise<Expense[]> =>
        expenses.getAll(session.group.id, session.user.id),
      true
    )
  );

  // GET /api/expense/month
  const YearMonth = t.type({
    year: intStringBetween(1500, 3000),
    month: intStringBetween(1, 12),
  });
  app.get(
    '/api/expense/month',
    server.processRequest<ExpenseCollection>((session, req) => {
      const params = validate(YearMonth, req.query);
      return expenses.getByMonth(
        session.group.id,
        session.user.id,
        params.year,
        params.month
      );
    }, true)
  );

  // GET /api/expense/search?[ExpenseSearch]
  app.get(
    '/api/expense/search',
    server.processRequest<UserExpense[]>(async (session, req) => {
      const query = validate(TExpenseQuery, req.query);
      return expenseSearch.search(session.user.id, session.group.id, query);
    })
  );

  // PUT /api/expense
  const expenseSchema: Schema<Expense> = {
    userId: V.positiveInt,
    date: V.date,
    receiver: V.stringWithLength(1, 50),
    type: V.either('expense', 'income', 'transfer'),
    sum: V.money,
    title: V.stringWithLength(1, 255),
    description: V.optional(V.or(V.string, V.null)),
    confirmed: V.optional(V.boolean),
    sourceId: V.optional(V.positiveInt),
    categoryId: V.positiveInt,
    division: V.optional(
      V.listOfObjects({
        userId: V.positiveInt,
        sum: V.money,
        type: V.stringWithLength(1, 10),
      })
    ),
  };
  app.put(
    '/api/expense',
    server.processRequest<ApiMessage>(
      (session, req) =>
        expenses.create(
          session.user.id,
          session.group.id,
          V.validate(expenseSchema, req.body),
          session.group.defaultSourceId || 0
        ),
      true
    )
  );

  const ReceiverSearch = t.type({
    receiver: stringWithLength(3, 50),
  });
  // GET /api/expense/receivers?receiver=[query]
  app.get(
    '/api/expense/receivers',
    server.processRequest<string[]>(
      async (session, req) =>
        (
          await expenses.queryReceivers(
            session.group.id,
            validate(ReceiverSearch, req.query).receiver
          )
        ).map(r => r.receiver),
      true
    )
  );

  const ExpenseSplitBody = t.type({
    splits: NonEmptyArray(ExpenseSplit),
  });
  // POST /api/expense/[expenseId]/split
  app.post(
    '/api/expense/:expenseId/split',
    server.processRequest<ApiMessage>(
      (session, req) =>
        expenses.split(
          session.group.id,
          session.user.id,
          validate(ExpenseIdType, req.params).expenseId,
          validate(ExpenseSplitBody, req.body).splits
        ),
      true
    )
  );

  // POST /api/expense/[expenseId]
  app.post(
    '/api/expense/:expenseId',
    server.processRequest<ApiMessage>(
      (session, req) =>
        expenses.update(
          session.group.id,
          session.user.id,
          validate(ExpenseIdType, req.params).expenseId,
          V.validate(expenseSchema, req.body),
          session.group.defaultSourceId || 0
        ),
      true
    )
  );

  // GET /api/expense/[expenseId]
  app.get(
    '/api/expense/:id',
    server.processRequest<UserExpenseWithDetails>(
      (session, req) =>
        expenses
          .getById(
            session.group.id,
            session.user.id,
            parseInt(req.params.id, 10)
          )
          .then(e =>
            expenses.getDivision(e.id).then(division => ({ ...e, division }))
          ),
      true
    )
  );

  // DELETE /api/expense/[expenseId]
  app.delete(
    '/api/expense/:id',
    server.processRequest<ApiMessage>(
      (session, req) =>
        expenses.deleteById(session.group.id, parseInt(req.params.id, 10)),
      true
    )
  );

  const recurringExpenseTargetSchema = t.type({
    target: TRecurringExpenseTarget,
  });

  // PUT /api/expense/recurring/[expenseId]
  app.put(
    '/api/expense/recurring/:id',
    server.processRequest<ApiMessage>(
      (session, req) =>
        expenses.createRecurring(
          session.group.id,
          session.user.id,
          parseInt(req.params.id, 10),
          validate(TRecurringExpenseInput, req.body)
        ),
      true
    )
  );

  // DELETE /api/expense/recurring/[expenseId]
  app.delete(
    '/api/expense/recurring/:id',
    server.processRequest<ApiMessage>(
      (session, req) =>
        expenses.deleteRecurringById(
          session.group.id,
          session.user.id,
          parseInt(req.params.id, 10),
          validate(recurringExpenseTargetSchema, req.query).target
        ),
      true
    )
  );

  // POST /api/expense/recurring/[expenseId]
  app.post(
    '/api/expense/recurring/:id',
    server.processRequest<ApiMessage>(
      (session, req) =>
        expenses.updateRecurring(
          session.group.id,
          session.user.id,
          parseInt(req.params.id, 10),
          validate(recurringExpenseTargetSchema, req.query).target,
          V.validate(expenseSchema, req.body),
          session.group.defaultSourceId || 0
        ),
      true
    )
  );

  // GET /api/admin/status
  app.get(
    '/api/admin/status',
    server.processRequest<DbStatus>(
      session => admin.getDbStatus(session.group.id),
      true
    )
  );
}
