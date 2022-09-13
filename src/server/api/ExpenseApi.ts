import { Router } from 'express';
import { z } from 'zod';

import { ApiMessage } from 'shared/types/Api';
import {
  ExpenseCollection,
  ExpenseInput,
  ExpenseQuery,
  RecurringExpenseInput,
  RecurringExpenseTarget,
  UserExpense,
} from 'shared/types/Expense';
import { ExpenseSplit } from 'shared/types/ExpenseSplit';
import { YearMonth } from 'shared/types/Time';
import {
  getExpenseAndDivision,
  updateExpenseById,
} from 'server/data/BasicExpenseService';
import { Expenses } from 'server/data/Expenses';
import { searchExpenses } from 'server/data/ExpenseSearch';
import { splitExpense } from 'server/data/ExpenseSplit';
import { Requests } from 'server/server/RequestHandling';

import { IdParamType } from './Validations';

/**
 * Creates expense API router.
 * Assumed attach path: `/api/expense`
 */
export function createExpenseApi() {
  const api = Router();

  // Attach recurring expense API
  api.use('/recurring', createRecurringExpenseApi());

  // GET /api/expense/month
  api.get(
    '/month',
    Requests.validatedTxRequest(
      { query: YearMonth, response: ExpenseCollection },
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
      { query: ExpenseQuery, response: z.array(UserExpense) },
      (tx, session, { query }) =>
        searchExpenses(tx, session.user.id, session.group.id, query)
    )
  );

  // PUT /api/expense
  api.put(
    '/',
    Requests.validatedTxRequest(
      { body: ExpenseInput, response: ApiMessage },
      (tx, session, { body }) =>
        Expenses.create(
          tx,
          session.user.id,
          session.group.id,
          body,
          session.group.defaultSourceId ?? 0
        ),
      true
    )
  );

  const ExpenseSplitBody = z.object({
    splits: z.array(ExpenseSplit).nonempty(),
  });
  // POST /api/expense/[expenseId]/split
  api.post(
    '/:id/split',
    Requests.validatedTxRequest(
      { params: IdParamType, body: ExpenseSplitBody },
      (tx, session, { params, body }) =>
        splitExpense(
          tx,
          session.group.id,
          session.user.id,
          params.id,
          body.splits
        ),
      true
    )
  );

  // POST /api/expense/[expenseId]
  api.post(
    '/:id',
    Requests.validatedTxRequest(
      { params: IdParamType, body: ExpenseInput },
      (tx, session, { params, body }) =>
        updateExpenseById(
          tx,
          session.group.id,
          session.user.id,
          params.id,
          body,
          session.group.defaultSourceId || 0
        ),
      true
    )
  );

  // GET /api/expense/[expenseId]
  api.get(
    '/:id',
    Requests.validatedTxRequest(
      { params: IdParamType },
      (tx, session, { params }) =>
        getExpenseAndDivision(tx, session.group.id, session.user.id, params.id),
      true
    )
  );

  // DELETE /api/expense/[expenseId]
  api.delete(
    '/:id',
    Requests.validatedTxRequest(
      { params: IdParamType },
      (tx, session, { params }) =>
        Expenses.deleteById(tx, session.group.id, params.id),
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
        params: IdParamType,
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
      { query: RecurringExpenseTargetSchema, params: IdParamType },
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
      {
        query: RecurringExpenseTargetSchema,
        params: IdParamType,
        body: ExpenseInput,
      },
      (tx, session, { query, params, body }) =>
        Expenses.updateRecurring(
          tx,
          session.group.id,
          session.user.id,
          params.id,
          query.target,
          body,
          session.group.defaultSourceId || 0
        ),
      true
    )
  );

  return api;
}
