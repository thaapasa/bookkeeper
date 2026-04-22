import { afterEach, beforeEach, describe, expect, it } from 'bun:test';

import { logoutSession, newCategory } from 'shared/expense/test';
import { createTestClient, SessionWithControl } from 'shared/net/test';
import { expectThrow } from 'shared/util/test';
import { logger } from 'server/Logger';

import { captureTestState, cleanupTestDataSince, TestState } from './TestCleanup';

describe('categories', () => {
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

  it('should not allow sub-sub-categories to be created', async () => {
    const c1 = await newCategory(session, { name: 'Pohja', parentId: 0 });
    expect(c1.categoryId).toBeGreaterThan(0);
    const c2 = await newCategory(session, {
      name: 'Keski',
      parentId: c1.categoryId!,
    });
    expect(c2.categoryId).toBeGreaterThan(0);
    await expectThrow(() => newCategory(session, { name: 'Alin', parentId: c2.categoryId! }));
  });
});
