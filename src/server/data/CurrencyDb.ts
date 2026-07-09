import { Currency, NotFoundError, ObjectId } from 'shared/types';
import { DbTask } from 'server/data/Db.ts';

/**
 * Currencies are global to the installation, not group-scoped, so no `group_id`
 * constraint applies here. EUR is intentionally absent: an expense with no currency
 * is by definition in EUR.
 */
const select = `--sql
SELECT id, code, symbol, name, country_code AS "countryCode"
FROM currencies`;

export async function getAllCurrencies(tx: DbTask): Promise<Currency[]> {
  return tx.manyOrNone<Currency>(`${select} ORDER BY code`);
}

export async function getCurrencyById(tx: DbTask, id: ObjectId): Promise<Currency> {
  const currency = await tx.oneOrNone<Currency>(`${select} WHERE id = $/id/::INTEGER`, { id });
  if (!currency) {
    throw new NotFoundError('CURRENCY_NOT_FOUND', 'currency', id);
  }
  return currency;
}

/**
 * Resolves a currency id coming from a request body, so an unknown id surfaces as a 404
 * rather than as a foreign key violation. A null id (an EUR expense) is always valid.
 */
export async function validateCurrencyId(
  tx: DbTask,
  currencyId: ObjectId | null | undefined,
): Promise<void> {
  if (currencyId != null) {
    await getCurrencyById(tx, currencyId);
  }
}
