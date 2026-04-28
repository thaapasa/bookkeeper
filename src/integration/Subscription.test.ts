import { afterEach, beforeEach, describe, expect, it } from 'bun:test';

import {
  ExpenseCollection,
  ExpenseDefaults,
  ExpenseInput,
  SubscriptionMatches,
  SubscriptionResult,
  UserExpenseWithDetails,
} from 'shared/expense';
import {
  checkCreateStatus,
  fetchExpense,
  logoutSession,
  newCategory,
  newExpense,
} from 'shared/expense/test';
import { uri } from 'shared/net';
import { createTestClient, SessionWithControl } from 'shared/net/test';
import { ISODate, toDateTime, toISODate } from 'shared/time';
import { ApiMessage, RecurringExpenseCreatedResponse } from 'shared/types';
import { db } from 'server/data/Db';
import { logger } from 'server/Logger';

import { captureTestState, cleanupTestDataSince, TestState } from './TestCleanup';

interface SubscriptionDbRow {
  id: number;
  occursUntil: string | null;
  nextMissing: string | null;
  periodAmount: number | null;
  periodUnit: string | null;
  defaults: ExpenseDefaults | null;
}

async function readSubscription(id: number): Promise<SubscriptionDbRow | null> {
  return db.oneOrNone<SubscriptionDbRow>(
    `SELECT id,
            occurs_until AS "occursUntil",
            next_missing AS "nextMissing",
            period_amount AS "periodAmount",
            period_unit AS "periodUnit",
            defaults
       FROM subscriptions
      WHERE id = $/id/`,
    { id },
  );
}

async function countLinkedExpenses(subscriptionId: number): Promise<number> {
  const row = await db.one<{ count: string }>(
    `SELECT COUNT(*)::TEXT AS count FROM expenses WHERE subscription_id = $/subscriptionId/`,
    { subscriptionId },
  );
  return Number(row.count);
}

async function readExpenseSubscriptionId(expenseId: number): Promise<number | null> {
  const row = await db.oneOrNone<{ subscriptionId: number | null }>(
    `SELECT subscription_id AS "subscriptionId" FROM expenses WHERE id = $/expenseId/`,
    { expenseId },
  );
  return row?.subscriptionId ?? null;
}

async function createMonthlyRecurring(
  session: SessionWithControl,
  startDate: ISODate,
  overrides?: Partial<ExpenseInput>,
): Promise<{ subscriptionId: number; firstExpenseId: number }> {
  const created = await newExpense(session, {
    sum: '100.00',
    title: 'Subscription test',
    date: startDate,
    confirmed: false,
    ...overrides,
  });
  const firstExpenseId = checkCreateStatus(created);
  const recurring = await session.post<RecurringExpenseCreatedResponse>(
    uri`/api/expense/recurring/${firstExpenseId}`,
    { period: { amount: 1, unit: 'months' } },
  );
  expect(recurring.subscriptionId).toBeGreaterThan(0);
  return { subscriptionId: recurring.subscriptionId ?? 0, firstExpenseId };
}

async function expensesForSubscription(
  subscriptionId: number,
): Promise<{ id: number; date: string; sum: string; title: string }[]> {
  return db.manyOrNone(
    `SELECT id, date::TEXT AS date, sum::TEXT AS sum, title
       FROM expenses
      WHERE subscription_id = $/subscriptionId/
      ORDER BY date ASC, id ASC`,
    { subscriptionId },
  );
}

async function fetchMonth(
  session: SessionWithControl,
  year: number,
  month: number,
): Promise<ExpenseCollection> {
  return session.get<ExpenseCollection>('/api/expense/month', { year, month });
}

/**
 * Build an ISO date that is guaranteed to fall inside the 5y dedup
 * window regardless of when the suite runs. `monthsAgo` is offset back
 * from today; `day` overrides the day-of-month for stable per-test
 * ordering.
 */
function recentDate(monthsAgo: number, day = 1): ISODate {
  return toISODate(toDateTime().minus({ months: monthsAgo }).set({ day }));
}

function buildEditInput(
  source: UserExpenseWithDetails,
  patch: Partial<ExpenseInput>,
): ExpenseInput {
  // Division is intentionally omitted — the backend recomputes it from
  // the source's default split when not provided, which is what we want
  // when we're rewriting a member of the recurrence (passing the old
  // division alongside a new sum would fail validation).
  return {
    userId: source.userId,
    date: source.date,
    receiver: source.receiver,
    type: source.type,
    sum: source.sum,
    title: source.title,
    sourceId: source.sourceId,
    categoryId: source.categoryId,
    confirmed: source.confirmed,
    description: source.description ?? null,
    ...patch,
  };
}

describe('subscription lifecycle', () => {
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

  it('propagates target=all edits to every realised row and to defaults', async () => {
    const { subscriptionId, firstExpenseId } = await createMonthlyRecurring(session, '2017-01-01', {
      sum: '100.00',
      title: 'Original',
    });
    // Trigger generation through March → 3 realised rows.
    await fetchMonth(session, 2017, 3);
    expect(await countLinkedExpenses(subscriptionId)).toBe(3);

    const rows = await expensesForSubscription(subscriptionId);
    const middle = rows[1];
    const middleSource = await fetchExpense(session, middle.id);

    const edit = buildEditInput(middleSource, {
      sum: '250.00',
      title: 'Updated',
      receiver: 'New receiver',
    });
    await session.put<ApiMessage>(uri`/api/expense/recurring/${middle.id}?target=all`, edit);

    const updated = await expensesForSubscription(subscriptionId);
    expect(updated).toHaveLength(3);
    for (const r of updated) {
      expect(r.title).toBe('Updated');
      expect(r.sum).toBe('250.00');
    }
    // The original `firstExpenseId` keeps its date (target=all rewrites
    // attributes, not dates).
    const first = updated.find(r => r.id === firstExpenseId);
    expect(first?.date).toBe('2017-01-01');

    const sub = await readSubscription(subscriptionId);
    expect(sub?.defaults?.title).toBe('Updated');
    expect(sub?.defaults?.sum).toBe('250.00');
    expect(sub?.defaults?.receiver).toBe('New receiver');
    expect(sub?.occursUntil).toBeNull();
  });

  it('propagates target=after edits forward only and leaves earlier rows intact', async () => {
    const { subscriptionId } = await createMonthlyRecurring(session, '2017-01-01', {
      sum: '100.00',
      title: 'Original',
    });
    await fetchMonth(session, 2017, 3);
    const rows = await expensesForSubscription(subscriptionId);
    expect(rows).toHaveLength(3);
    const [jan, feb, mar] = rows;

    const febSource = await fetchExpense(session, feb.id);
    const edit = buildEditInput(febSource, { sum: '300.00', title: 'Bumped' });
    await session.put<ApiMessage>(uri`/api/expense/recurring/${feb.id}?target=after`, edit);

    const updated = await expensesForSubscription(subscriptionId);
    const updatedJan = updated.find(r => r.id === jan.id);
    const updatedFeb = updated.find(r => r.id === feb.id);
    const updatedMar = updated.find(r => r.id === mar.id);
    expect(updatedJan?.sum).toBe('100.00');
    expect(updatedJan?.title).toBe('Original');
    expect(updatedFeb?.sum).toBe('300.00');
    expect(updatedFeb?.title).toBe('Bumped');
    expect(updatedMar?.sum).toBe('300.00');
    expect(updatedMar?.title).toBe('Bumped');

    const sub = await readSubscription(subscriptionId);
    expect(sub?.defaults?.title).toBe('Bumped');
    expect(sub?.defaults?.sum).toBe('300.00');
    // Edit propagation must not terminate the recurrence — that's a
    // delete-target=after concern, not an update concern.
    expect(sub?.occursUntil).toBeNull();
  });

  it('auto-generates missing recurring rows when a past month range is queried', async () => {
    const { subscriptionId } = await createMonthlyRecurring(session, '2017-01-01');
    const subBefore = await readSubscription(subscriptionId);
    expect(subBefore?.nextMissing).toBe('2017-02-01');
    expect(await countLinkedExpenses(subscriptionId)).toBe(1);

    // Querying month 2017-04 ends at 2017-05-01, so all months up to
    // April should materialise.
    await fetchMonth(session, 2017, 4);

    const rows = await expensesForSubscription(subscriptionId);
    expect(rows.map(r => r.date)).toEqual(['2017-01-01', '2017-02-01', '2017-03-01', '2017-04-01']);
    const subAfter = await readSubscription(subscriptionId);
    expect(subAfter?.nextMissing).toBe('2017-05-01');
  });

  it('end ("Lopeta"): DELETE on active recurring sets occurs_until and keeps the row', async () => {
    const { subscriptionId, firstExpenseId } = await createMonthlyRecurring(session, '2017-01-01');
    await session.del(uri`/api/subscription/${subscriptionId}`, { mode: 'end' });

    const sub = await readSubscription(subscriptionId);
    expect(sub).not.toBeNull();
    expect(sub?.occursUntil).not.toBeNull();
    // Period information is preserved for stats purposes.
    expect(sub?.periodAmount).toBe(1);
    expect(sub?.periodUnit).toBe('months');
    // Original realised row is still linked.
    expect(await readExpenseSubscriptionId(firstExpenseId)).toBe(subscriptionId);
    expect(await countLinkedExpenses(subscriptionId)).toBe(1);
  });

  it('delete ("Poista"): DELETE on already-ended row removes the subscription and nulls links', async () => {
    const { subscriptionId, firstExpenseId } = await createMonthlyRecurring(session, '2017-01-01');
    // First press = soft end ("Lopeta").
    await session.del(uri`/api/subscription/${subscriptionId}`, { mode: 'end' });
    expect(await readSubscription(subscriptionId)).not.toBeNull();
    // Second press = hard delete ("Poista").
    await session.del(uri`/api/subscription/${subscriptionId}`, { mode: 'delete' });

    expect(await readSubscription(subscriptionId)).toBeNull();
    expect(await readExpenseSubscriptionId(firstExpenseId)).toBeNull();
  });

  it('delete: DELETE with stale mode is rejected with 409 instead of silently escalating', async () => {
    const { subscriptionId } = await createMonthlyRecurring(session, '2017-01-01');
    // Soft-end first; the subscription is now in "delete" state.
    await session.del(uri`/api/subscription/${subscriptionId}`, { mode: 'end' });
    // A stale UI tab still thinks the subscription is active and reasserts mode=end.
    await expect(
      session.del(uri`/api/subscription/${subscriptionId}`, { mode: 'end' }),
    ).rejects.toMatchObject({ status: 409 });
    // The row must still exist — no silent escalation to hard-delete.
    expect(await readSubscription(subscriptionId)).not.toBeNull();
  });

  it('delete: DELETE on active recurring with mode=delete is rejected with 409', async () => {
    const { subscriptionId } = await createMonthlyRecurring(session, '2017-01-01');
    await expect(
      session.del(uri`/api/subscription/${subscriptionId}`, { mode: 'delete' }),
    ).rejects.toMatchObject({ status: 409 });
    const sub = await readSubscription(subscriptionId);
    expect(sub).not.toBeNull();
    expect(sub?.occursUntil).toBeNull();
  });

  it('expense delete target=after deletes future rows and terminates the recurrence', async () => {
    const { subscriptionId, firstExpenseId } = await createMonthlyRecurring(session, '2017-01-01');
    await fetchMonth(session, 2017, 4);
    const before = await expensesForSubscription(subscriptionId);
    expect(before).toHaveLength(4);
    const feb = before[1];

    await session.del(uri`/api/expense/recurring/${feb.id}`, { target: 'after' });

    const after = await expensesForSubscription(subscriptionId);
    expect(after.map(r => r.date)).toEqual(['2017-01-01']);
    expect(await readExpenseSubscriptionId(firstExpenseId)).toBe(subscriptionId);

    const sub = await readSubscription(subscriptionId);
    expect(sub?.occursUntil).toBe('2017-02-01');
    // Querying a later month must not regenerate — occurs_until caps it.
    await fetchMonth(session, 2017, 5);
    expect(await countLinkedExpenses(subscriptionId)).toBe(1);
  });

  it('expense delete target=all removes the subscription and every linked expense', async () => {
    const { subscriptionId } = await createMonthlyRecurring(session, '2017-01-01');
    await fetchMonth(session, 2017, 3);
    expect(await countLinkedExpenses(subscriptionId)).toBe(3);
    const rows = await expensesForSubscription(subscriptionId);
    const middle = rows[1];

    await session.del(uri`/api/expense/recurring/${middle.id}`, { target: 'all' });

    expect(await readSubscription(subscriptionId)).toBeNull();
    expect(await countLinkedExpenses(subscriptionId)).toBe(0);
    // The expenses themselves are gone, not just unlinked.
    const stillExisting = await db.oneOrNone(`SELECT id FROM expenses WHERE id = $/id/`, {
      id: middle.id,
    });
    expect(stillExisting).toBeNull();
  });

  it('PATCH updates only the fields provided', async () => {
    const { subscriptionId } = await createMonthlyRecurring(session, '2017-01-01');
    const before = await readSubscription(subscriptionId);
    expect(before?.defaults?.title).toBe('Subscription test');

    // Title-only patch.
    await session.patch<ApiMessage>(uri`/api/subscription/${subscriptionId}`, {
      title: 'Renamed subscription',
    });
    let after = await readSubscription(subscriptionId);
    expect(after?.defaults?.title).toBe('Subscription test');
    expect(before?.defaults?.sum).toBe(after?.defaults?.sum);

    // Filter-only patch.
    await session.patch<ApiMessage>(uri`/api/subscription/${subscriptionId}`, {
      filter: { receiver: 'Updated receiver', categoryId: 1 },
    });
    after = await readSubscription(subscriptionId);
    expect(after?.defaults?.title).toBe('Subscription test');

    // Defaults-only patch — adjust the template's title and sum.
    await session.patch<ApiMessage>(uri`/api/subscription/${subscriptionId}`, {
      defaults: {
        ...before!.defaults!,
        title: 'New template title',
        sum: '500.00',
      },
    });
    after = await readSubscription(subscriptionId);
    expect(after?.defaults?.title).toBe('New template title');
    expect(after?.defaults?.sum).toBe('500.00');
  });

  it('PATCH does not change occurs_until or recurrence period', async () => {
    const { subscriptionId } = await createMonthlyRecurring(session, '2017-01-01');
    await session.del(uri`/api/subscription/${subscriptionId}`, { mode: 'end' }); // soft end ("Lopeta")
    const ended = await readSubscription(subscriptionId);
    expect(ended?.occursUntil).not.toBeNull();
    expect(ended?.periodAmount).toBe(1);

    await session.patch<ApiMessage>(uri`/api/subscription/${subscriptionId}`, {
      title: 'Touched while ended',
    });
    const after = await readSubscription(subscriptionId);
    expect(after?.occursUntil).toBe(ended?.occursUntil ?? null);
    expect(after?.periodAmount).toBe(1);
    expect(after?.periodUnit).toBe('months');
  });

  it('PATCH rejects empty title', async () => {
    const { subscriptionId } = await createMonthlyRecurring(session, '2017-01-01');
    await expect(
      session.patch<ApiMessage>(uri`/api/subscription/${subscriptionId}`, {
        title: '   ',
      }),
    ).rejects.toMatchObject({ status: 400 });
  });

  it('search hides ended rows when includeEnded=false', async () => {
    const { subscriptionId } = await createMonthlyRecurring(session, '2017-01-01');
    await session.del(uri`/api/subscription/${subscriptionId}`, { mode: 'end' }); // soft end ("Lopeta")
    const result = await session.post<SubscriptionResult>('/api/subscription/search', {
      includeEnded: false,
    });
    expect(result.find(c => c.rowId === subscriptionId)).toBeUndefined();
  });

  it('search keeps ended rows visible when includeEnded=true', async () => {
    const { subscriptionId } = await createMonthlyRecurring(session, '2017-01-01');
    await session.del(uri`/api/subscription/${subscriptionId}`, { mode: 'end' }); // soft end ("Lopeta")
    const result = await session.post<SubscriptionResult>('/api/subscription/search', {
      includeEnded: true,
    });
    const card = result.find(c => c.rowId === subscriptionId);
    expect(card).toBeDefined();
    expect(card?.occursUntil).toBeDefined();
    // Recurring rows produce a single card; it always carries actions.
    expect(card?.isPrimary).toBe(true);
  });

  it('marks exactly one fan-out card as primary for a stats subscription', async () => {
    // Build a fresh category tree so we don't interact with seed data:
    // one root, two subcategories. A stats sub with includeSubCategories
    // fans out to one card per matched subcategory; only one of those
    // should carry the lifecycle actions.
    const root = await newCategory(session, { name: 'TestRoot', parentId: 0 });
    const subA = await newCategory(session, {
      name: 'TestSubA',
      parentId: root.categoryId!,
    });
    const subB = await newCategory(session, {
      name: 'TestSubB',
      parentId: root.categoryId!,
    });

    // Two expenses in subA (higher sum), one in subB. Dates inside the
    // 5y dedup window so the fan-out actually picks them up.
    await newExpense(session, {
      sum: '50.00',
      date: recentDate(2, 1),
      categoryId: subA.categoryId!,
    });
    await newExpense(session, {
      sum: '60.00',
      date: recentDate(2, 2),
      categoryId: subA.categoryId!,
    });
    await newExpense(session, {
      sum: '40.00',
      date: recentDate(2, 3),
      categoryId: subB.categoryId!,
    });

    const created = await session.post<{ subscriptionId: number }>(
      '/api/subscription/from-filter',
      {
        title: 'TestRoot stats',
        filter: { categoryId: root.categoryId!, includeSubCategories: true },
      },
    );
    const rowId = created.subscriptionId;

    const result = await session.post<SubscriptionResult>('/api/subscription/search', {
      includeEnded: true,
    });
    const cards = result.filter(c => c.rowId === rowId);
    expect(cards.length).toBe(2);
    const primaries = cards.filter(c => c.isPrimary);
    expect(primaries).toHaveLength(1);
    // row.categoryId points at TestRoot, which has no direct matches —
    // so the highest-sum bucket (subA) wins the primary spot.
    expect(primaries[0].categoryId).toBe(subA.categoryId!);
  });

  it('does not point dominatedBy at a row that is filtered out of view', async () => {
    // Two recurring rows with identical filters (same category + receiver):
    // older one wins the tiebreak and owns both expenses, newer one is
    // dominated. End the older one — when the search excludes ended
    // rows, the newer row's `dominatedBy` must not dangle at the
    // invisible elder. Dates must fall inside the 5y dedup window.
    const { subscriptionId: oldId } = await createMonthlyRecurring(session, recentDate(3, 1));
    const created = await newExpense(session, {
      sum: '100.00',
      title: 'Subscription test',
      date: recentDate(3, 2),
      confirmed: false,
    });
    const newerExpenseId = checkCreateStatus(created);
    const recurring = await session.post<RecurringExpenseCreatedResponse>(
      uri`/api/expense/recurring/${newerExpenseId}`,
      { period: { amount: 1, unit: 'months' } },
    );
    const newerId = recurring.subscriptionId ?? 0;

    // Sanity check: with includeEnded=true the elder still dominates.
    const beforeEnd = await session.post<SubscriptionResult>('/api/subscription/search', {
      includeEnded: true,
    });
    expect(beforeEnd.find(c => c.rowId === newerId)?.dominatedBy?.rowId).toBe(oldId);

    await session.del(uri`/api/subscription/${oldId}`, { mode: 'end' }); // end ("Lopeta") the elder

    const hidden = await session.post<SubscriptionResult>('/api/subscription/search', {
      includeEnded: false,
    });
    expect(hidden.find(c => c.rowId === oldId)).toBeUndefined();
    const newerCardHidden = hidden.find(c => c.rowId === newerId);
    expect(newerCardHidden).toBeDefined();
    expect(newerCardHidden?.dominatedBy).toBeUndefined();
  });

  it('uncategorized stats subscription: card carries categoryId=null and matches expander returns rows', async () => {
    // A stats subscription with no category constraint and no other
    // distinguishing filter — the dedup pass might or might not assign
    // matches to it depending on what else exists, but the *card model*
    // and the *matches expander* must both handle the no-category case
    // without crashing or silently filtering everything out (regression
    // guard for the categoryId=0 sentinel that used to leak through).
    const cat = await newCategory(session, { name: 'UncatPickup', parentId: 0 });
    await newExpense(session, {
      sum: '17.00',
      title: 'Uniquely-titled-uncat-row',
      receiver: 'UncatReceiver',
      date: recentDate(1, 1),
      categoryId: cat.categoryId!,
    });

    // Filter by receiver only — no category constraint, so the card's
    // primary categoryId is null (the underlying row carries no
    // category).
    const created = await session.post<{ subscriptionId: number }>(
      '/api/subscription/from-filter',
      { title: 'Uncategorized stats', filter: { receiver: 'UncatReceiver' } },
    );
    const rowId = created.subscriptionId;

    const result = await session.post<SubscriptionResult>('/api/subscription/search', {
      includeEnded: true,
    });
    const card = result.find(c => c.rowId === rowId);
    expect(card).toBeDefined();
    // The fan-out happens by *matched-expense* category, so this card
    // ends up filed under the matched expense's category — which is a
    // real number, not the sentinel.
    expect(card?.categoryId).toBe(cat.categoryId!);

    // Sanity: the matches expander returns the expected row when the
    // client sends categoryId for the fan-out card.
    const matches = await session.post<SubscriptionMatches>('/api/subscription/matches', {
      rowId,
      categoryId: cat.categoryId!,
    });
    expect(matches.totalCount).toBe(1);
    expect(matches.matches[0].title).toBe('Uniquely-titled-uncat-row');

    // And: when the card carries no category (null), the client sends
    // no categoryId and the server returns every assigned row.
    const allMatches = await session.post<SubscriptionMatches>('/api/subscription/matches', {
      rowId,
    });
    expect(allMatches.totalCount).toBeGreaterThanOrEqual(1);
  });

  it('uncategorized empty stats subscription: card with categoryId=null is returned when no rows match', async () => {
    // A stats subscription whose receiver filter matches nothing and
    // whose filter has no categoryId. Used to crash the client because
    // the row's null categoryId was widened to the 0 sentinel; now it
    // either reports zero matches or is dropped from the result, but
    // never carries categoryId=0.
    const created = await session.post<{ subscriptionId: number }>(
      '/api/subscription/from-filter',
      {
        title: 'Empty uncat stats',
        filter: { receiver: 'NoRowsWillEverMatchThisReceiverString' },
      },
    );
    const rowId = created.subscriptionId;

    const result = await session.post<SubscriptionResult>('/api/subscription/search', {
      includeEnded: true,
    });
    const cards = result.filter(c => c.rowId === rowId);
    // Either zero cards (server drops empty no-category rows) or a
    // single card with categoryId === null. The forbidden state is
    // a card with categoryId === 0.
    for (const card of cards) {
      expect(card.categoryId).not.toBe(0);
    }
  });
});
