import { Router } from 'express';

import { CurrencyRates } from 'shared/types';
import { getCurrencyRates } from 'server/data/CurrencyRates';
import { createValidatingRouter } from 'server/server/ValidatingRouter';

/**
 * Creates currency API router.
 * Assumed attach path: `/api/currency`
 *
 * The list of supported currencies is delivered with the session, so it is not repeated here.
 */
export function createCurrencyApi() {
  const api = createValidatingRouter(Router());

  // GET /api/currency/rates
  // Authenticated but not group-scoped, and deliberately non-transactional: the rates come
  // from the ECB, not from the database.
  api.get('/rates', { response: CurrencyRates }, () => getCurrencyRates());

  return api.router;
}
