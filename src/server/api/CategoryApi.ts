import { Router } from 'express';

import { ApiMessage } from 'shared/types/Api';
import { CategoryInput } from 'shared/types/Category';
import { Category, CategoryAndTotals } from 'shared/types/Session';
import { DateRange } from 'shared/util/TimeRange';
import { Requests } from 'server/server/RequestHandling';

import { CategoryDb } from '../data/CategoryDb';
import { IdType } from './Validations';

/**
 * Creates category API router.
 * Assumed attach path: `/api/category`
 */
export function createCategoryApi() {
  const api = Router();

  // GET /api/category/list
  api.get(
    '/list',
    Requests.txRequest(
      (tx, session) => CategoryDb.getAll(tx, session.group.id),
      true
    )
  );

  // PUT /api/category

  api.put(
    '/',
    Requests.validatedTxRequest(
      { body: CategoryInput },
      async (tx, session, { body }): Promise<ApiMessage> => {
        const id = await CategoryDb.create(tx, session.group.id, body);
        return { status: 'OK', message: 'Category created', categoryId: id };
      },
      true
    )
  );

  // GET /api/category/totals
  api.get(
    '/totals',
    Requests.validatedTxRequest(
      { query: DateRange },
      (tx, session, { query }): Promise<CategoryAndTotals[]> => {
        return CategoryDb.getTotals(tx, session.group.id, query);
      },
      true
    )
  );

  // POST /api/category/categoryId
  api.post(
    '/:id',
    Requests.validatedTxRequest(
      { body: CategoryInput, params: IdType },
      (tx, session, { body, params }): Promise<Category> =>
        CategoryDb.update(tx, session.group.id, params.id, body),
      true
    )
  );

  // GET /api/category/categoryId
  api.get(
    '/:id',
    Requests.validatedTxRequest(
      { params: IdType },
      (tx, session, { params }): Promise<Category> =>
        CategoryDb.getById(tx, session.group.id, params.id),
      true
    )
  );

  // DELETE /api/category/categoryId
  api.delete(
    '/:id',
    Requests.validatedTxRequest(
      { params: IdType },
      (tx, session, { params }): Promise<ApiMessage> =>
        CategoryDb.remove(tx, session.group.id, params.id),
      true
    )
  );

  return api;
}
