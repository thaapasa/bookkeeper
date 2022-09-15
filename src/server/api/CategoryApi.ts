import { Router } from 'express';

import { DateRange } from 'shared/time';
import { ApiMessage } from 'shared/types/Api';
import { CategoryInput } from 'shared/types/Category';
import { Category, CategoryAndTotals } from 'shared/types/Session';
import { Requests } from 'server/server/RequestHandling';

import { CategoryDb } from '../data/CategoryDb';
import { IdParamType } from './Validations';

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
      { body: CategoryInput, response: ApiMessage },
      async (tx, session, { body }) => {
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
      { body: CategoryInput, params: IdParamType },
      (tx, session, { body, params }): Promise<Category> =>
        CategoryDb.update(tx, session.group.id, params.id, body),
      true
    )
  );

  // GET /api/category/categoryId
  api.get(
    '/:id',
    Requests.validatedTxRequest(
      { params: IdParamType },
      (tx, session, { params }): Promise<Category> =>
        CategoryDb.getById(tx, session.group.id, params.id),
      true
    )
  );

  // DELETE /api/category/categoryId
  api.delete(
    '/:id',
    Requests.validatedTxRequest(
      { params: IdParamType, response: ApiMessage },
      (tx, session, { params }) =>
        CategoryDb.remove(tx, session.group.id, params.id),
      true
    )
  );

  return api;
}
