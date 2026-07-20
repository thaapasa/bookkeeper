import { afterEach, beforeEach, describe, expect, it } from 'bun:test';

import { ExpenseShortcut } from 'shared/expense';
import { logoutSession } from 'shared/expense/test';
import { createTestClient, SessionWithControl } from 'shared/net/test';
import { logger } from 'server/Logger';

describe('shortcuts', () => {
  let session: SessionWithControl;
  const createdIds: number[] = [];
  const client = createTestClient({ logger });

  beforeEach(async () => {
    session = await client.getSession('sale', 'salasana');
  });

  afterEach(async () => {
    // Shortcuts are not covered by TestCleanup; delete created rows explicitly
    for (const id of createdIds) {
      await session.del(`/api/profile/shortcut/${id}`).catch(() => undefined);
    }
    createdIds.length = 0;
    await logoutSession(session);
  });

  it('round-trips statement targets', async () => {
    const created = await session.post<ExpenseShortcut>('/api/profile/shortcut', {
      title: 'HSL',
      expense: { title: 'Matkakortti', categoryId: 1 },
      statementTargets: ['HSL MOBIILI'],
    });
    createdIds.push(created.id);
    expect(created.statementTargets).toEqual(['HSL MOBIILI']);

    const fetched = await session.get<ExpenseShortcut>(`/api/profile/shortcut/${created.id}`);
    expect(fetched.statementTargets).toEqual(['HSL MOBIILI']);
    expect(fetched.expense).toEqual({ title: 'Matkakortti', categoryId: 1 });

    await session.put(`/api/profile/shortcut/${created.id}`, {
      title: 'HSL',
      expense: { title: 'Matkakortti' },
      statementTargets: ['HSL MOBIILI', 'HSL AUTOMAATTI'],
    });
    const updated = await session.get<ExpenseShortcut>(`/api/profile/shortcut/${created.id}`);
    expect(updated.statementTargets).toEqual(['HSL MOBIILI', 'HSL AUTOMAATTI']);
  });

  it('defaults statement targets to an empty list', async () => {
    const created = await session.post<ExpenseShortcut>('/api/profile/shortcut', {
      title: 'Ilman kohdetta',
      expense: {},
    });
    createdIds.push(created.id);
    expect(created.statementTargets).toEqual([]);
  });
});
