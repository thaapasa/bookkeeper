import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { connect } from 'net';

import { Expense } from 'shared/expense';
import { newExpense } from 'shared/expense/test';
import { createTestClient, SessionWithControl } from 'shared/net/test';
import { uri } from 'shared/net/UrlUtils';
import { BkError, ExpenseGrouping, ExpenseGroupingData } from 'shared/types';
import { logger } from 'server/Logger';

import { captureTestState, cleanupTestDataSince, TestState } from './TestCleanup';

const HOST = 'localhost';
const PORT = 3100;

/**
 * Sends a raw HTTP request and returns the response status code. Needed because
 * `fetch` normalizes `..` segments out of URLs before sending, so a traversal
 * attack can only be reproduced on a raw socket.
 */
function rawRequestStatus(path: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const socket = connect(PORT, HOST, () => {
      socket.write(`GET ${path} HTTP/1.1\r\nHost: ${HOST}\r\nConnection: close\r\n\r\n`);
    });
    let response = '';
    // Resolve as soon as the status line arrives — the server may keep the
    // socket open, so waiting for the connection to end would hang.
    socket.on('data', chunk => {
      response += String(chunk);
      const match = /^HTTP\/1\.[01] (\d{3})/.exec(response);
      if (match) {
        socket.destroy();
        resolve(Number(match[1]));
      } else if (response.includes('\r\n')) {
        socket.destroy();
        reject(new Error(`Malformed HTTP response: ${response.slice(0, 200)}`));
      }
    });
    socket.on('error', reject);
  });
}

async function expectStatus(status: number, p: () => Promise<unknown>): Promise<BkError> {
  try {
    await p();
  } catch (e) {
    expect(e).toBeInstanceOf(BkError);
    const error = e as BkError;
    expect(error.status).toEqual(status);
    return error;
  }
  throw new Error(`Expected request to fail with HTTP ${status}, but it succeeded`);
}

function groupingData(
  title: string,
  overrides?: Partial<ExpenseGroupingData>,
): ExpenseGroupingData {
  return {
    title,
    color: '#8a2be2',
    tags: [],
    private: false,
    onlyOwn: false,
    categories: [],
    ...overrides,
  };
}

function createGrouping(
  session: SessionWithControl,
  data: ExpenseGroupingData,
  groupId?: number,
): Promise<ExpenseGrouping> {
  return session.post<ExpenseGrouping>(
    uri`/api/grouping` + (groupId ? uri`?groupId=${groupId}` : ''),
    data,
  );
}

describe('security regressions', () => {
  const client = createTestClient({ logger });

  describe('authentication runs before input validation', () => {
    // A request that is both unauthenticated and invalid must fail with 401,
    // not 400 — validation errors would leak API shape to anonymous callers.
    const invalidBody = { complete: 'garbage' };

    it('returns 401 for missing token with invalid body', async () => {
      await expectStatus(401, () => client.post('', '/api/expense', invalidBody));
      await expectStatus(401, () => client.put('', '/api/expense/1', invalidBody));
    });

    it('returns 401 for bogus token with invalid body', async () => {
      const bogus = 'f'.repeat(40);
      await expectStatus(401, () => client.post(bogus, '/api/expense', invalidBody));
      await expectStatus(401, () => client.put(bogus, '/api/expense/1', invalidBody));
    });
  });

  describe('/content path traversal', () => {
    it('rejects .. traversal out of the content root', async () => {
      // Before the fix this served the project's package.json.
      expect(await rawRequestStatus('/content/../package.json')).toEqual(404);
      expect(await rawRequestStatus('/content/../../../../etc/hosts')).toEqual(404);
    });

    it('rejects absolute-path escapes', async () => {
      expect(await rawRequestStatus('/content//etc/hosts')).toEqual(404);
    });

    it('still returns 404 for missing files inside the root', async () => {
      expect(await rawRequestStatus('/content/no-such-file.png')).toEqual(404);
    });
  });

  describe('group scoping of untrusted body ids', () => {
    let sale: SessionWithControl;
    let jenni: SessionWithControl;
    let state: TestState;

    beforeEach(async () => {
      sale = await client.getSession('sale', 'salasana');
      jenni = await client.getSession('jenni', 'salasana');
      state = await captureTestState();
    });

    afterEach(async () => {
      await cleanupTestDataSince(sale.group.id, state);
      await sale.logout();
      await jenni.logout();
    });

    it('rejects creating an expense with a grouping not visible to the caller', async () => {
      const hidden = await createGrouping(
        jenni,
        groupingData(`Jennin piilo ${Date.now()}`, { private: true }),
      );

      const error = await expectStatus(404, () => newExpense(sale, { groupingId: hidden.id }));
      expect(error.code).toEqual('EXPENSE_GROUPING_NOT_FOUND');
    });

    it('rejects updating an expense to a grouping not visible to the caller', async () => {
      const hidden = await createGrouping(
        jenni,
        groupingData(`Jennin piilo ${Date.now()}`, { private: true }),
      );

      const created = await newExpense(sale);
      const org = await sale.get<Expense>(uri`/api/expense/${created.expenseId}`);
      const error = await expectStatus(404, () =>
        sale.put(uri`/api/expense/${org.id}`, { ...org, groupingId: hidden.id }),
      );
      expect(error.code).toEqual('EXPENSE_GROUPING_NOT_FOUND');
    });

    it('rejects a nonexistent groupingId', async () => {
      await expectStatus(404, () => newExpense(sale, { groupingId: 999999999 }));
    });

    it('allows attaching a grouping that is visible to the caller', async () => {
      const shared = await createGrouping(jenni, groupingData(`Yhteinen ${Date.now()}`));

      const created = await newExpense(sale, { groupingId: shared.id });
      const expense = await sale.get<Expense>(uri`/api/expense/${created.expenseId}`);
      expect(expense.groupingId).toEqual(shared.id);
    });

    // User id 999999 does not exist in any group; the membership lookup
    // treats a nonexistent user and a member of another group identically,
    // so these pin the same group-scoping behavior for both cases.
    const foreignUserId = 999999;

    it('rejects creating an expense attributed to a user outside the group', async () => {
      const error = await expectStatus(404, () => newExpense(sale, { userId: foreignUserId }));
      expect(error.code).toEqual('USER_NOT_FOUND');
    });

    it('rejects updating an expense to a user outside the group', async () => {
      const created = await newExpense(sale);
      const org = await sale.get<Expense>(uri`/api/expense/${created.expenseId}`);
      const error = await expectStatus(404, () =>
        sale.put(uri`/api/expense/${org.id}`, { ...org, userId: foreignUserId }),
      );
      expect(error.code).toEqual('USER_NOT_FOUND');
    });

    it('rejects division rows attributed to a user outside the group', async () => {
      const error = await expectStatus(404, () =>
        newExpense(sale, {
          sum: '10.00',
          division: [
            { type: 'cost', userId: sale.user.id, sum: '-10.00' },
            { type: 'benefit', userId: foreignUserId, sum: '10.00' },
          ],
        }),
      );
      expect(error.code).toEqual('USER_NOT_FOUND');
    });

    it('rejects updating a recurring expense to a user outside the group', async () => {
      const created = await newExpense(sale, { date: '2017-01-15' });
      await sale.post(uri`/api/expense/recurring/${created.expenseId}`, {
        period: { amount: 1, unit: 'months' },
      });
      const org = await sale.get<Expense>(uri`/api/expense/${created.expenseId}`);
      const error = await expectStatus(404, () =>
        sale.put(uri`/api/expense/recurring/${org.id}?target=all`, {
          ...org,
          userId: foreignUserId,
        }),
      );
      expect(error.code).toEqual('USER_NOT_FOUND');
    });

    it('rejects creating a grouping with a category from another group', async () => {
      // sale is also a member of group 2 (Herrakerho), which has no categories;
      // the category id in the body belongs to group 1.
      const foreignCategoryId = sale.categories[0].id;
      const error = await expectStatus(404, () =>
        sale.post(
          '/api/grouping?groupId=2',
          groupingData(`Vieras kategoria ${Date.now()}`, { categories: [foreignCategoryId] }),
        ),
      );
      expect(error.code).toEqual('CATEGORY_NOT_FOUND');
    });

    it('rejects updating a grouping with a category from another group', async () => {
      const grouping = await createGrouping(
        sale,
        groupingData(`Herrakerhon ryhmä ${Date.now()}`),
        2,
      );

      const foreignCategoryId = sale.categories[0].id;
      const error = await expectStatus(404, () =>
        sale.put(uri`/api/grouping/${grouping.id}?groupId=${2}`, {
          ...groupingData(grouping.title),
          categories: [foreignCategoryId],
        }),
      );
      expect(error.code).toEqual('CATEGORY_NOT_FOUND');
    });
  });
});
