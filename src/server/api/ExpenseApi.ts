import { Router } from 'express';
import { z } from 'zod';

import { ApiMessage } from 'shared/types/Api';
import {
  Expense,
  ExpenseQuery,
  RecurringExpenseInput,
  RecurringExpenseTarget,
  UserExpenseWithDetails,
} from 'shared/types/Expense';
import { ExpenseSplit } from 'shared/types/ExpenseSplit';
import { YearMonth } from 'shared/types/Time';
import { updateExpenseById } from 'server/data/BasicExpenseService';
import { Expenses } from 'server/data/Expenses';
import { searchExpenses } from 'server/data/ExpenseSearch';
import { splitExpense } from 'server/data/ExpenseSplit';
import { Requests } from 'server/server/RequestHandling';

import { Schema, Validator as V } from '../util/Validator';
import { ExpenseIdType, IdType } from './Validations';

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
    Requests.validatedTxRequest(
      { query: YearMonth },
      (tx, session, { query }) =>
        Expenses.getByMonth(
          tx,
          session.group.id,
          session.user.id,
          query.year,
          query.month
        ),
      true
    )
  );

  // GET /api/expense/search?[ExpenseSearch]
  api.get(
    '/search',
    Requests.validatedTxRequest(
      { query: ExpenseQuery },
      (tx, session, { query }) =>
        searchExpenses(tx, session.user.id, session.group.id, query)
    )
  );

  // PUT /api/expense
  api.put(
    '/',
    Requests.txRequest<ApiMessage>(
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

  const ReceiverSearch = z.object({
    receiver: z.string().min(3).max(50),
  });
  // GET /api/expense/receivers?receiver=[query]
  api.get(
    '/receivers',
    Requests.validatedTxRequest(
      { query: ReceiverSearch },
      async (tx, session, { query }) =>
        (
          await Expenses.queryReceivers(tx, session.group.id, query.receiver)
        ).map(r => r.receiver),
      true
    )
  );

  const ExpenseSplitBody = z.object({
    splits: z.array(ExpenseSplit).nonempty(),
  });
  // POST /api/expense/[expenseId]/split
  api.post(
    '/:expenseId/split',
    Requests.validatedTxRequest(
      { params: ExpenseIdType, body: ExpenseSplitBody },
      (tx, session, { params, body }) =>
        splitExpense(
          tx,
          session.group.id,
          session.user.id,
          params.expenseId,
          body.splits
        ),
      true
    )
  );

  // POST /api/expense/[expenseId]
  api.post(
    '/:expenseId',
    Requests.validatedTxRequest(
      { params: ExpenseIdType },
      (tx, session, { params }, req) =>
        updateExpenseById(
          tx,
          session.group.id,
          session.user.id,
          params.expenseId,
          V.validate(expenseSchema, req.body),
          session.group.defaultSourceId || 0
        ),
      true
    )
  );

  // GET /api/expense/[expenseId]
  api.get(
    '/:id',
    Requests.txRequest<UserExpenseWithDetails>(
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
    Requests.txRequest<ApiMessage>(
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

  const RecurringExpenseTargetSchema = z.object({
    target: RecurringExpenseTarget,
  });

  // PUT /api/expense/recurring/[expenseId]
  api.put(
    '/:id',
    Requests.validatedTxRequest(
      {
        body: RecurringExpenseInput,
        params: IdType,
      },
      (tx, session, { body, params }) =>
        Expenses.createRecurring(
          tx,
          session.group.id,
          session.user.id,
          params.id,
          body
        ),
      true
    )
  );

  // DELETE /api/expense/recurring/[expenseId]
  api.delete(
    '/:id',
    Requests.validatedTxRequest(
      { query: RecurringExpenseTargetSchema, params: IdType },
      (tx, session, { query, params }) =>
        Expenses.deleteRecurringById(
          tx,
          session.group.id,
          session.user.id,
          params.id,
          query.target
        ),
      true
    )
  );

  // POST /api/expense/recurring/[expenseId]
  api.post(
    '/:id',
    Requests.validatedTxRequest(
      { query: RecurringExpenseTargetSchema, params: IdType },
      (tx, session, { query, params }, req) =>
        Expenses.updateRecurring(
          tx,
          session.group.id,
          session.user.id,
          params.id,
          query.target,
          V.validate(expenseSchema, req.body),
          session.group.defaultSourceId || 0
        ),
      true
    )
  );

  return api;
}
