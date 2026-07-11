import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { expectArrayMatching } from 'test/expect/expectArrayMatching';

import { ExpenseSplit, UserExpense, UserExpenseWithDetails } from 'shared/expense';
import {
  fetchExpense,
  fetchMonthStatus,
  linkSplitExpenses,
  logoutSession,
  newExpense,
  splitExpense,
  unlinkSplitExpense,
} from 'shared/expense/test';
import { createTestClient, SessionWithControl } from 'shared/net/test';
import { uri } from 'shared/net/UrlUtils';
import { YearMonth } from 'shared/time';
import { Money } from 'shared/util';
import { logger } from 'server/Logger';

import { checkMonthStatus } from './MonthStatus';
import { captureTestState, cleanupTestDataSince, TestState } from './TestCleanup';

const month: YearMonth = { year: 2017, month: 1 };

describe('splitting expenses', () => {
  let session: SessionWithControl;
  let state: TestState;
  let expense: UserExpenseWithDetails;

  const client = createTestClient({ logger });

  beforeEach(async () => {
    session = await client.getSession('sale', 'salasana');
    state = await captureTestState();
    const m = await newExpense(session, {
      sum: '100.00',
      confirmed: false,
      date: '2017-01-15',
      title: 'Ruokakauppa',
    });
    expense = await fetchExpense(session, m.expenseId ?? 0);
  });
  afterEach(async () => {
    await cleanupTestDataSince(session.group.id, state);
    await logoutSession(session);
  });

  it('should not allow invalid split data', async () => {
    expect(expense).toMatchObject({ title: 'Ruokakauppa' });
    await expect(
      splitExpense(session, expense.id, [{ foo: 'bar' }, { baz: 'kok' }] as any),
    ).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
    });
  });

  it('should not create splits without at least two split items', async () => {
    expect(expense).toMatchObject({ title: 'Ruokakauppa' });
    await expect(splitExpense(session, expense.id, [{ ...SPLIT_DATA }])).rejects.toMatchObject({
      code: 'INVALID_SPLIT',
      data: { cause: 'Expense splitting requires at least two splits' },
    });
  });

  it('should not allow splits with wrong item sum', async () => {
    expect(expense).toMatchObject({ title: 'Ruokakauppa' });
    await expect(
      splitExpense(session, expense.id, [
        { ...SPLIT_DATA, sum: '15.00' },
        { ...SPLIT_DATA, sum: '80.00' },
      ]),
    ).rejects.toMatchObject({
      code: 'INVALID_SPLIT',
      data: { cause: 'Split sums (95.00) do not match expense sum (100.00)' },
    });
  });

  it('T61 - should split expense into two parts', async () => {
    const m = await fetchMonthStatus(session, month);
    const status = checkMonthStatus(m);
    expect(expense).toMatchObject({
      title: 'Ruokakauppa',
      userBalance: '0.00',
      userBenefit: '50.00',
      userCost: '-50.00',
    });
    const userId = session.user.id;
    await expect(
      splitExpense(session, expense.id, [
        {
          ...SPLIT_DATA,
          sum: '15.00',
          title: 'Pilke1',
          division: [
            { type: 'benefit', sum: '15.00', userId },
            { type: 'cost', sum: '-15.00', userId },
          ],
        },
        {
          ...SPLIT_DATA,
          title: 'Pilke2',
          sum: '85.00',
          division: [
            { type: 'benefit', sum: '85.00', userId },
            { type: 'cost', sum: '-85.00', userId },
          ],
        },
      ]),
    ).resolves.toMatchObject({ status: 'OK' });
    expect(checkMonthStatus(await fetchMonthStatus(session, month))).toMatchObject({
      ...status,
      benefit: Money.from(status.benefit).plus(50).toString(),
      cost: Money.from(status.cost).minus(50).toString(),
    });
    // Original expense is no longer found
    await expect(fetchExpense(session, expense.id)).rejects.toMatchObject({
      status: 404,
    });
    const newStatus = await fetchMonthStatus(session, month);
    expectArrayMatching(newStatus.expenses, [
      { title: 'Pilke1', sum: '15.00' },
      { title: 'Pilke2', sum: '85.00' },
    ]);
  });

  it('should mark split parts with a shared split id, reused on re-split', async () => {
    expect(expense.splitId).toBeNull();
    await splitInTwo(session, expense.id, ['Pilke1', 'Pilke2'], ['40.00', '60.00']);

    const parts = await fetchByTitle(session, 'Pilke1', 'Pilke2');
    expect(parts).toHaveLength(2);
    const splitId = parts[0].splitId;
    expect(splitId).toBeTruthy();
    expect(parts[1].splitId).toEqual(splitId);

    // Re-splitting a part keeps the original split id on its parts
    await splitInTwo(session, parts[0].id, ['Pilke1a', 'Pilke1b'], ['15.00', '25.00']);
    const resplit = await fetchByTitle(session, 'Pilke1a', 'Pilke1b', 'Pilke2');
    expect(resplit).toHaveLength(3);
    for (const p of resplit) {
      expect(p.splitId).toEqual(splitId);
    }

    // A regular new expense gets no split id
    const plain = await newExpense(session, { date: '2017-01-15', title: 'Tavallinen' });
    expect((await fetchExpense(session, plain.expenseId ?? 0)).splitId).toBeNull();
  });

  it('should link and unlink expenses manually, merging split groups', async () => {
    const mk = async (title: string) => {
      const m = await newExpense(session, { date: '2017-01-20', title, sum: '10.00' });
      return m.expenseId ?? 0;
    };
    const [a, b, c, d] = [
      await mk('LinkA'),
      await mk('LinkB'),
      await mk('LinkC'),
      await mk('LinkD'),
    ];

    // Linking two unlinked expenses creates a fresh shared split id
    await expect(linkSplitExpenses(session, a, b)).resolves.toMatchObject({ status: 'OK' });
    const [ea, eb] = [await fetchExpense(session, a), await fetchExpense(session, b)];
    expect(ea.splitId).toBeTruthy();
    expect(eb.splitId).toEqual(ea.splitId);

    // Linking two expenses of another group forms a second, distinct group
    await linkSplitExpenses(session, c, d);
    const ec = await fetchExpense(session, c);
    expect(ec.splitId).toBeTruthy();
    expect(ec.splitId).not.toEqual(ea.splitId);

    // Linking members of two different groups merges every member to one id
    await linkSplitExpenses(session, d, b);
    const all = await Promise.all([a, b, c, d].map(id => fetchExpense(session, id)));
    const ids = new Set(all.map(e => e.splitId));
    expect(ids.size).toEqual(1);
    expect(all[0].splitId).toBeTruthy();

    // Self-link is rejected
    await expect(linkSplitExpenses(session, a, a)).rejects.toMatchObject({
      code: 'INVALID_SPLIT_LINK',
    });

    // Unlinking removes only the expense itself while ≥2 others remain
    await expect(unlinkSplitExpense(session, a)).resolves.toMatchObject({ status: 'OK' });
    expect((await fetchExpense(session, a)).splitId).toBeNull();
    expect((await fetchExpense(session, b)).splitId).toBeTruthy();

    // Unlinking down to a group of one clears the last member too
    await unlinkSplitExpense(session, b);
    expect((await fetchExpense(session, c)).splitId).toBeTruthy();
    await unlinkSplitExpense(session, c);
    expect((await fetchExpense(session, d)).splitId).toBeNull();

    // Unlinking an unlinked expense is a no-op
    await expect(unlinkSplitExpense(session, a)).resolves.toMatchObject({ status: 'OK' });
  });

  it('should not split or link subscription-generated expenses', async () => {
    // Convert the test expense to recurring; it becomes subscription-generated
    await session.post(uri`/api/expense/recurring/${expense.id}`, {
      period: { amount: 1, unit: 'months' },
    });

    await expect(
      splitExpense(session, expense.id, [
        { ...SPLIT_DATA, sum: '40.00' },
        { ...SPLIT_DATA, sum: '60.00' },
      ]),
    ).rejects.toMatchObject({
      code: 'INVALID_SPLIT',
      data: { cause: 'Subscription-generated expenses cannot be split' },
    });

    const m = await newExpense(session, { date: '2017-01-15', title: 'Tavallinen' });
    const plainId = m.expenseId ?? 0;
    await expect(linkSplitExpenses(session, plainId, expense.id)).rejects.toMatchObject({
      code: 'INVALID_SPLIT_LINK',
    });
    await expect(linkSplitExpenses(session, expense.id, plainId)).rejects.toMatchObject({
      code: 'INVALID_SPLIT_LINK',
    });
  });

  it('should not convert a split-linked expense to recurring', async () => {
    const m = await newExpense(session, { date: '2017-01-20', title: 'Linkattu' });
    const otherId = m.expenseId ?? 0;
    await linkSplitExpenses(session, expense.id, otherId);

    // A row must not become both subscription-generated and split-linked;
    // the user unlinks first, then converts.
    await expect(
      session.post(uri`/api/expense/recurring/${expense.id}`, {
        period: { amount: 1, unit: 'months' },
      }),
    ).rejects.toMatchObject({ code: 'INVALID_INPUT' });
    expect((await fetchExpense(session, expense.id)).subscriptionId).toBeNull();

    await unlinkSplitExpense(session, expense.id);
    const s = await session.post<{ subscriptionId: number }>(
      uri`/api/expense/recurring/${expense.id}`,
      { period: { amount: 1, unit: 'months' } },
    );
    expect(s.subscriptionId).toBeGreaterThan(0);
  });

  it('should not accept a client-supplied split id', async () => {
    const m = await newExpense(session, {
      date: '2017-01-21',
      title: 'Huijaus',
      splitId: '00000000-0000-0000-0000-000000000001',
    } as any);
    expect((await fetchExpense(session, m.expenseId ?? 0)).splitId).toBeNull();
  });

  it('should keep the foreign currency annotation only on the first split part', async () => {
    const usd = session.currencies.find(c => c.code === 'USD')!;
    const m = await newExpense(session, {
      sum: '100.00',
      date: '2017-01-16',
      title: 'Matkakulut',
      currencyId: usd.id,
      originalCurrencyValue: '114.35',
    });
    const foreign = await fetchExpense(session, m.expenseId ?? 0);
    expect(foreign).toMatchObject({ currencyId: usd.id, originalCurrencyValue: '114.35' });

    const userId = session.user.id;
    await expect(
      splitExpense(session, foreign.id, [
        {
          ...SPLIT_DATA,
          sum: '40.00',
          title: 'Osa1',
          division: [
            { type: 'benefit', sum: '40.00', userId },
            { type: 'cost', sum: '-40.00', userId },
          ],
        },
        {
          ...SPLIT_DATA,
          sum: '60.00',
          title: 'Osa2',
          division: [
            { type: 'benefit', sum: '60.00', userId },
            { type: 'cost', sum: '-60.00', userId },
          ],
        },
      ]),
    ).resolves.toMatchObject({ status: 'OK' });

    // The first part keeps the annotation as a reference to what the original expense
    // cost abroad (the parent row is deleted on split). The rest must be EUR-only:
    // inheriting would leave every part claiming to have cost the full $114.35.
    const parts = (await fetchMonthStatus(session, month)).expenses.filter(e =>
      ['Osa1', 'Osa2'].includes(e.title),
    );
    expect(parts).toHaveLength(2);
    const first = parts.find(p => p.title === 'Osa1')!;
    const second = parts.find(p => p.title === 'Osa2')!;
    expect(first.currencyId).toEqual(usd.id);
    expect(first.originalCurrencyValue).toEqual('114.35');
    expect(second.currencyId).toBeNull();
    expect(second.originalCurrencyValue).toBeNull();
  });
});

const SPLIT_DATA: ExpenseSplit = {
  sourceId: 1,
  categoryId: 1,
  sum: '10.00',
  division: [{ sum: '10.00', type: 'benefit', userId: 1 }],
  title: 'Osa',
};

/** Splits an expense into two parts with the given titles and sums. */
async function splitInTwo(
  session: SessionWithControl,
  expenseId: number,
  titles: [string, string],
  sums: [string, string],
) {
  const userId = session.user.id;
  const part = (title: string, sum: string): ExpenseSplit => ({
    ...SPLIT_DATA,
    title,
    sum,
    division: [
      { type: 'benefit', sum, userId },
      { type: 'cost', sum: Money.from(sum).negate().toString(), userId },
    ],
  });
  await expect(
    splitExpense(session, expenseId, [part(titles[0], sums[0]), part(titles[1], sums[1])]),
  ).resolves.toMatchObject({ status: 'OK' });
}

/** Fetches the January 2017 expenses having the given titles. */
async function fetchByTitle(
  session: SessionWithControl,
  ...titles: string[]
): Promise<UserExpense[]> {
  const status = await fetchMonthStatus(session, month);
  return status.expenses.filter(e => titles.includes(e.title));
}
