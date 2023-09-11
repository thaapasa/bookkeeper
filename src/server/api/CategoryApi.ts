import { Router } from 'express';

import { DateRange } from 'shared/time';
import { ApiMessage, Category, CategoryAndTotals, CategoryInput } from 'shared/types';
import { createValidatingRouter } from 'server/server/ValidatingRouter';

import {
  createCategory,
  deleteCategory,
  getAllCategories,
  getCategoryById,
  getCategoryTotals,
  updateCategory,
} from '../data/CategoryDb';

/**
 * Creates category API router.
 * Assumed attach path: `/api/category`
 */
export function createCategoryApi() {
  const api = createValidatingRouter(Router());

  // GET /api/category/list
  // List all categories
  api.getTx('/list', {}, (tx, session) => getAllCategories(tx, session.group.id), true);

  // POST /api/category
  // Create new category
  api.postTx(
    '/',
    { body: CategoryInput, response: ApiMessage },
    async (tx, session, { body }) => {
      const id = await createCategory(tx, session.group.id, body);
      return { status: 'OK', message: 'Category created', categoryId: id };
    },
    true,
  );

  // GET /api/category/totals
  api.getTx(
    '/totals',
    { query: DateRange },
    (tx, session, { query }): Promise<CategoryAndTotals[]> => {
      return getCategoryTotals(tx, session.group.id, query);
    },
    true,
  );

  // PUT /api/category/categoryId
  // Update category
  api.putTx(
    '/:categoryId',
    { body: CategoryInput },
    (tx, session, { body, params }): Promise<Category> => updateCategory(tx, session.group.id, params.categoryId, body),
    true,
  );

  // GET /api/category/categoryId
  // Get category data
  api.getTx(
    '/:categoryId',
    {},
    (tx, session, { params }): Promise<Category> => getCategoryById(tx, session.group.id, params.categoryId),
    true,
  );

  // DELETE /api/category/categoryId
  // Delete category
  api.deleteTx(
    '/:categoryId',
    { response: ApiMessage },
    (tx, session, { params }) => deleteCategory(tx, session.group.id, params.categoryId),
    true,
  );

  return api.router;
}
