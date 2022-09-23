import { Router } from 'express';

import { DateRange } from 'shared/time';
import {
  ApiMessage,
  Category,
  CategoryAndTotals,
  CategoryInput,
} from 'shared/types';
import { createValidatingRouter } from 'server/server/ValidatingRouter';

import { CategoryDb } from '../data/CategoryDb';

/**
 * Creates category API router.
 * Assumed attach path: `/api/category`
 */
export function createCategoryApi() {
  const api = createValidatingRouter(Router());

  // GET /api/category/list
  api.getTx(
    '/list',
    {},
    (tx, session) => CategoryDb.getAll(tx, session.group.id),
    true
  );

  // PUT /api/category

  api.putTx(
    '/',
    { body: CategoryInput, response: ApiMessage },
    async (tx, session, { body }) => {
      const id = await CategoryDb.create(tx, session.group.id, body);
      return { status: 'OK', message: 'Category created', categoryId: id };
    },
    true
  );

  // GET /api/category/totals
  api.getTx(
    '/totals',
    { query: DateRange },
    (tx, session, { query }): Promise<CategoryAndTotals[]> => {
      return CategoryDb.getTotals(tx, session.group.id, query);
    },
    true
  );

  // POST /api/category/categoryId
  api.postTx(
    '/:categoryId',
    { body: CategoryInput },
    (tx, session, { body, params }): Promise<Category> =>
      CategoryDb.update(tx, session.group.id, params.categoryId, body),
    true
  );

  // GET /api/category/categoryId
  api.getTx(
    '/:categoryId',
    {},
    (tx, session, { params }): Promise<Category> =>
      CategoryDb.getById(tx, session.group.id, params.categoryId),
    true
  );

  // DELETE /api/category/categoryId
  api.deleteTx(
    '/:categoryId',
    { response: ApiMessage },
    (tx, session, { params }) =>
      CategoryDb.remove(tx, session.group.id, params.categoryId),
    true
  );

  return api.router;
}
