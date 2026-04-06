import { Router } from 'express';

import { DateRange } from 'shared/time';
import { Category, CategoryAndTotals, CategoryIdResponse, CategoryInput } from 'shared/types';
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
  api.getTx('/list', { groupRequired: true }, (tx, session) =>
    getAllCategories(tx, session.group.id),
  );

  // POST /api/category
  // Create new category
  api.postTx(
    '/',
    { body: CategoryInput, response: CategoryIdResponse, groupRequired: true },
    async (tx, session, { body }) => {
      const id = await createCategory(tx, session.group.id, body);
      return { status: 'OK', message: 'Category created', categoryId: id };
    },
  );

  // GET /api/category/totals
  api.getTx(
    '/totals',
    { query: DateRange, groupRequired: true },
    (tx, session, { query }): Promise<CategoryAndTotals[]> => {
      return getCategoryTotals(tx, session.group.id, query);
    },
  );

  // PUT /api/category/categoryId
  // Update category
  api.putTx(
    '/:categoryId',
    { body: CategoryInput, groupRequired: true },
    (tx, session, { body, params }): Promise<Category> =>
      updateCategory(tx, session.group.id, params.categoryId, body),
  );

  // GET /api/category/categoryId
  // Get category data
  api.getTx(
    '/:categoryId',
    { groupRequired: true },
    (tx, session, { params }): Promise<Category> =>
      getCategoryById(tx, session.group.id, params.categoryId),
  );

  // DELETE /api/category/categoryId
  // Delete category
  api.deleteTx(
    '/:categoryId',
    { response: CategoryIdResponse, groupRequired: true },
    (tx, session, { params }) => deleteCategory(tx, session.group.id, params.categoryId),
  );

  return api.router;
}
