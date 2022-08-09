import { Router } from 'express';
import * as t from 'io-ts';

import { ApiMessage } from 'shared/types/Api';
import { Category, CategoryAndTotals } from 'shared/types/Session';
import { validate } from 'shared/types/Validator';
import { TISODate } from 'shared/util/Time';

import categories, { CategoryInput } from '../data/Categories';
import * as server from '../util/ServerUtil';
import { Schema, Validator as V } from '../util/Validator';

/**
 * Creates category API router.
 * Assumed attach path: `/api/category`
 */
export function createCategoryApi() {
  const api = Router();

  // GET /api/category/list
  api.get(
    '/list',
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
  api.put(
    '/',
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
  api.get(
    '/totals',
    server.processRequest((session, req): Promise<CategoryAndTotals[]> => {
      const params = validate(DateRange, req.query);
      return categories.getTotals(session.group.id, params);
    }, true)
  );

  // POST /api/category/categoryId
  api.post(
    '/:id',
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
  api.get(
    '/:id',
    server.processRequest(
      (session, req): Promise<Category> =>
        categories.getById(session.group.id, parseInt(req.params.id, 10)),
      true
    )
  );

  // DELETE /api/category/categoryId
  api.delete(
    '/:id',
    server.processRequest(
      (session, req): Promise<ApiMessage> =>
        categories.remove(session.group.id, parseInt(req.params.id, 10)),
      true
    )
  );

  return api;
}
