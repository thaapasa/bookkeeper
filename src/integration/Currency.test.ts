import { afterEach, beforeEach, describe, expect, it } from 'bun:test';

import { UserExpenseWithDetails } from 'shared/expense';
import { checkCreateStatus, fetchExpense, logoutSession, newExpense } from 'shared/expense/test';
import { createTestClient, SessionWithControl } from 'shared/net/test';
import { Currency, CurrencyRates } from 'shared/types';
import { expectThrow } from 'shared/util/test';
import { logger } from 'server/Logger';

import { captureTestState, cleanupTestDataSince, TestState } from './TestCleanup';

describe('currencies', () => {
  let session: SessionWithControl;
  let state: TestState;
  let usd: Currency;

  const client = createTestClient({ logger });

  beforeEach(async () => {
    session = await client.getSession('sale', 'salasana');
    state = await captureTestState();
    usd = session.currencies.find(c => c.code === 'USD')!;
  });

  afterEach(async () => {
    await cleanupTestDataSince(session.group.id, state);
    await logoutSession(session);
  });

  it('are delivered with the session', () => {
    expect(session.currencies).toBeInstanceOf(Array);
    expect(session.currencies.length).toBeGreaterThan(0);
    expect(usd).toMatchObject({ code: 'USD', symbol: '$', countryCode: 'US' });
  });

  it('never include EUR, since a null currency means EUR', () => {
    expect(session.currencies.find(c => c.code === 'EUR')).toBeUndefined();
  });

  it('expose ECB rates as strings, keyed by code, based on EUR', async () => {
    const rates = await session.get<CurrencyRates>('/api/currency/rates');
    expect(rates.base).toEqual('EUR');
    expect(rates.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(typeof rates.rates.USD).toEqual('string');
    expect(Number(rates.rates.USD)).toBeGreaterThan(0);
    // EUR is the base, so it is not quoted against itself
    expect(rates.rates.EUR).toBeUndefined();
  });

  it('require authentication for rates', async () => {
    await expectThrow(() => client.get('', '/api/currency/rates'));
  });

  it('round-trip a foreign currency annotation on an expense', async () => {
    const created = await newExpense(session, {
      sum: '43.73',
      currencyId: usd.id,
      originalCurrencyValue: '50.00',
    });
    const expense = await fetchExpense(session, checkCreateStatus(created));

    expect(expense.currencyId).toEqual(usd.id);
    expect(expense.originalCurrencyValue).toEqual('50.00');
    // The EUR sum stays the source of truth and is untouched by the annotation
    expect(expense.sum).toEqual('43.73');
  });

  it('leave currency null for a plain EUR expense', async () => {
    const created = await newExpense(session, { sum: '10.00' });
    const expense = await fetchExpense(session, checkCreateStatus(created));
    expect(expense.currencyId).toBeNull();
    expect(expense.originalCurrencyValue).toBeNull();
  });

  it('reject a currency without an amount', async () => {
    await expectThrow(() => newExpense(session, { sum: '10.00', currencyId: usd.id }));
  });

  it('reject an amount without a currency', async () => {
    await expectThrow(() => newExpense(session, { sum: '10.00', originalCurrencyValue: '50.00' }));
  });

  it('reject an unknown currency id', async () => {
    await expectThrow(() =>
      newExpense(session, { sum: '10.00', currencyId: 999999, originalCurrencyValue: '50.00' }),
    );
  });

  it('clear the annotation when the expense is edited back to EUR', async () => {
    const created = await newExpense(session, {
      sum: '43.73',
      currencyId: usd.id,
      originalCurrencyValue: '50.00',
    });
    const id = checkCreateStatus(created);
    const expense: UserExpenseWithDetails = await fetchExpense(session, id);

    await session.put(`/api/expense/${id}`, {
      ...expense,
      currencyId: null,
      originalCurrencyValue: null,
    });

    const updated = await fetchExpense(session, id);
    expect(updated.currencyId).toBeNull();
    expect(updated.originalCurrencyValue).toBeNull();
    expect(updated.sum).toEqual('43.73');
  });
});
