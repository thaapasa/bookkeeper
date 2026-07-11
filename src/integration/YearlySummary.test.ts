import { afterEach, beforeEach, describe, expect, it } from 'bun:test';

import { logoutSession, newCategory, newExpense } from 'shared/expense/test';
import { createTestClient, SessionWithControl } from 'shared/net/test';
import { ISODate, toDateTime } from 'shared/time';
import { YearlySummary } from 'shared/types';
import { logger } from 'server/Logger';

import { captureTestState, cleanupTestDataSince, TestState } from './TestCleanup';

// Safely inside the endpoint's "last 10 calendar years" window on any run date
const testYear = toDateTime().minus({ years: 3 }).year;
const date = (monthDay: string) => `${testYear}-${monthDay}` as ISODate;

describe('yearly summary', () => {
  let session: SessionWithControl;
  let state: TestState;
  const client = createTestClient({ logger });

  beforeEach(async () => {
    session = await client.getSession('sale', 'salasana');
    state = await captureTestState();
  });

  afterEach(async () => {
    await cleanupTestDataSince(session.group.id, state);
    await logoutSession(session);
  });

  it('rolls sums up to top categories and filters transfers and excluded categories', async () => {
    const parent = await newCategory(session, { name: 'Vuositesti', parentId: 0 });
    const sub = await newCategory(session, {
      name: 'Vuositesti-alakategoria',
      parentId: parent.categoryId!,
    });
    const excludedSub = await newCategory(session, {
      name: 'Vuositesti-pois',
      parentId: parent.categoryId!,
      excludeFromTotals: true,
    });
    const excludedParent = await newCategory(session, {
      name: 'Vuositesti-sijoitukset',
      parentId: 0,
      excludeFromTotals: true,
    });
    const subOfExcluded = await newCategory(session, {
      name: 'Vuositesti-sijoitukset-ala',
      parentId: excludedParent.categoryId!,
    });

    // Counted: expense via sub rolls up to parent, income directly on parent
    await newExpense(session, { date: date('05-15'), sum: '100.00', categoryId: sub.categoryId! });
    await newExpense(session, {
      date: date('05-16'),
      sum: '2500.00',
      type: 'income',
      categoryId: parent.categoryId!,
    });
    // Filtered out: transfer by type, the rest by category exclusion
    await newExpense(session, {
      date: date('05-17'),
      sum: '50.00',
      type: 'transfer',
      categoryId: sub.categoryId!,
    });
    await newExpense(session, {
      date: date('05-18'),
      sum: '70.00',
      categoryId: excludedSub.categoryId!,
    });
    await newExpense(session, {
      date: date('05-19'),
      sum: '60.00',
      categoryId: subOfExcluded.categoryId!,
    });
    await newExpense(session, {
      date: date('05-20'),
      sum: '80.00',
      categoryId: excludedParent.categoryId!,
    });

    const summary = await session.get<YearlySummary>('/api/statistics/yearly');

    const testYearRows = summary.rows.filter(r => r.year === testYear);
    expect(testYearRows).toContainEqual({
      year: testYear,
      categoryId: parent.categoryId!,
      type: 'expense',
      sum: '100.00',
    });
    expect(testYearRows).toContainEqual({
      year: testYear,
      categoryId: parent.categoryId!,
      type: 'income',
      sum: '2500.00',
    });
    expect(summary.rows.filter(r => r.categoryId === excludedParent.categoryId)).toHaveLength(0);
  });
});
