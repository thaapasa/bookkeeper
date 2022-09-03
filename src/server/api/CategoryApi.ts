import { Router } from 'express';

import { ApiMessage } from 'shared/types/Api';
import { Category, CategoryAndTotals } from 'shared/types/Session';
import { validate } from 'shared/types/Validator';
import { DateRange } from 'shared/util/TimeRange';

import { CategoryDb, CategoryInput } from '../data/CategoryDb';
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
    server.processTxRequest(
      (tx, session): Promise<Category[]> =>
        CategoryDb.getAll(tx, session.group.id),
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
    server.processTxRequest(async (tx, session, req): Promise<ApiMessage> => {
      const id = await CategoryDb.create(
        tx,
        session.group.id,
        V.validate(categorySchema, req.body)
      );
      return { status: 'OK', message: 'Category created', categoryId: id };
    }, true)
  );

  // GET /api/category/totals
  api.get(
    '/totals',
    server.processTxRequest(
      (tx, session, req): Promise<CategoryAndTotals[]> => {
        const params = validate(DateRange, req.query);
        return CategoryDb.getTotals(tx, session.group.id, params);
      },
      true
    )
  );

  // POST /api/category/categoryId
  api.post(
    '/:id',
    server.processTxRequest(
      (tx, session, req): Promise<Category> =>
        CategoryDb.update(
          tx,
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
    server.processTxRequest(
      (tx, session, req): Promise<Category> =>
        CategoryDb.getById(tx, session.group.id, parseInt(req.params.id, 10)),
      true
    )
  );

  // DELETE /api/category/categoryId
  api.delete(
    '/:id',
    server.processTxRequest(
      (tx, session, req): Promise<ApiMessage> =>
        CategoryDb.remove(tx, session.group.id, parseInt(req.params.id, 10)),
      true
    )
  );

  return api;
}
