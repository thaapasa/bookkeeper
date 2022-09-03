import { Router } from 'express';
import * as t from 'io-ts';

import { ApiMessage } from 'shared/types/Api';
import {
  Expense,
  ExpenseCollection,
  ExpenseQuery,
  RecurringExpenseInput,
  RecurringExpenseTarget,
  UserExpense,
  UserExpenseWithDetails,
} from 'shared/types/Expense';
import { ExpenseSplit } from 'shared/types/ExpenseSplit';
import { YearMonth } from 'shared/types/Time';
import {
  NonEmptyArray,
  NumberString,
  stringWithLength,
  validate,
} from 'shared/types/Validator';
import { updateExpenseById } from 'server/data/BasicExpenseService';
import { Expenses } from 'server/data/Expenses';
import { searchExpenses } from 'server/data/ExpenseSearch';
import { splitExpense } from 'server/data/ExpenseSplit';

import * as server from '../util/ServerUtil';
import { Schema, Validator as V } from '../util/Validator';

const ExpenseIdType = t.type({ expenseId: NumberString });

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

/**
 * Creates expense API router.
 * Assumed attach path: `/api/expense`
 */
export function createExpenseApi() {
  const api = Router();

  api.use('/recurring', createRecurringExpenseApi());

  // GET /api/expense/month
  api.get(
    '/month',
    server.processTxRequest<ExpenseCollection>((tx, session, req) => {
      const params = validate(YearMonth, req.query);
      return Expenses.getByMonth(
        tx,
        session.group.id,
        session.user.id,
        params.year,
        params.month
      );
    }, true)
  );

  // GET /api/expense/search?[ExpenseSearch]
  api.get(
    '/search',
    server.processTxRequest<UserExpense[]>(async (tx, session, req) => {
      const query = validate(ExpenseQuery, req.query);
      return searchExpenses(tx, session.user.id, session.group.id, query);
    })
  );

  // PUT /api/expense
  api.put(
    '/',
    server.processTxRequest<ApiMessage>(
      (tx, session, req) =>
        Expenses.create(
          tx,
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
  api.get(
    '/receivers',
    server.processTxRequest<string[]>(
      async (tx, session, req) =>
        (
          await Expenses.queryReceivers(
            tx,
            session.group.id,
            validate(ReceiverSearch, req.query).receiver
          )
        ).map(r => r.receiver),
      true
    )
  );

  const ExpenseSplitBody = t.type(
    { splits: NonEmptyArray(ExpenseSplit) },
    'ExpenseSplitBody'
  );
  // POST /api/expense/[expenseId]/split
  api.post(
    '/:expenseId/split',
    server.processTxRequest<ApiMessage>(
      (tx, session, req) =>
        splitExpense(
          tx,
          session.group.id,
          session.user.id,
          validate(ExpenseIdType, req.params).expenseId,
          validate(ExpenseSplitBody, req.body).splits
        ),
      true
    )
  );

  // POST /api/expense/[expenseId]
  api.post(
    '/:expenseId',
    server.processTxRequest<ApiMessage>(
      (tx, session, req) =>
        updateExpenseById(
          tx,
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
  api.get(
    '/:id',
    server.processTxRequest<UserExpenseWithDetails>(
      (tx, session, req) =>
        Expenses.getById(
          tx,
          session.group.id,
          session.user.id,
          parseInt(req.params.id, 10)
        ).then(e =>
          Expenses.getDivision(tx, e.id).then(division => ({ ...e, division }))
        ),
      true
    )
  );

  // DELETE /api/expense/[expenseId]
  api.delete(
    '/:id',
    server.processTxRequest<ApiMessage>(
      (tx, session, req) =>
        Expenses.deleteById(tx, session.group.id, parseInt(req.params.id, 10)),
      true
    )
  );

  return api;
}

/**
 * Creates recurring expense API.
 * Assumed attach path: `/api/expense/recurring`
 */
function createRecurringExpenseApi() {
  const api = Router();

  const RecurringExpenseTargetSchema = t.type(
    { target: RecurringExpenseTarget },
    'RecurringExpenseTargetSchema'
  );

  // PUT /api/expense/recurring/[expenseId]
  api.put(
    '/:id',
    server.processTxRequest<ApiMessage>(
      (tx, session, req) =>
        Expenses.createRecurring(
          tx,
          session.group.id,
          session.user.id,
          parseInt(req.params.id, 10),
          validate(RecurringExpenseInput, req.body)
        ),
      true
    )
  );

  // DELETE /api/expense/recurring/[expenseId]
  api.delete(
    '/:id',
    server.processTxRequest<ApiMessage>(
      (tx, session, req) =>
        Expenses.deleteRecurringById(
          tx,
          session.group.id,
          session.user.id,
          parseInt(req.params.id, 10),
          validate(RecurringExpenseTargetSchema, req.query).target
        ),
      true
    )
  );

  // POST /api/expense/recurring/[expenseId]
  api.post(
    '/:id',
    server.processTxRequest<ApiMessage>(
      (tx, session, req) =>
        Expenses.updateRecurring(
          tx,
          session.group.id,
          session.user.id,
          parseInt(req.params.id, 10),
          validate(RecurringExpenseTargetSchema, req.query).target,
          V.validate(expenseSchema, req.body),
          session.group.defaultSourceId || 0
        ),
      true
    )
  );

  return api;
}
