import { afterEach, beforeEach, describe, expect, it } from 'bun:test';

import { findSourceId, findUserId, logoutSession } from 'shared/expense/test';
import { createTestClient, SessionWithControl } from 'shared/net/test';
import { Source } from 'shared/types';
import { expectThrow } from 'shared/util/test';
import { logger } from 'server/Logger';

describe('source user cards', () => {
  let session: SessionWithControl;
  let sourceId: number;
  let userId: number;
  const client = createTestClient({ logger });

  beforeEach(async () => {
    session = await client.getSession('sale', 'salasana');
    sourceId = findSourceId('Yhteinen tili', session);
    userId = findUserId('sale', session);
  });

  afterEach(async () => {
    // Mutates a seed row, which TestCleanup does not reverse; restore the
    // empty-cards baseline explicitly.
    await session.patch(`/api/source/${sourceId}/user/${userId}`, { cards: [] });
    await logoutSession(session);
  });

  it('stores and returns cards for a source user', async () => {
    const updated = await session.patch<Source>(`/api/source/${sourceId}/user/${userId}`, {
      cards: ['1226', '0011'],
    });
    expect(updated.users.find(u => u.userId === userId)?.cards).toEqual(['1226', '0011']);

    const fetched = await session.get<Source>(`/api/source/${sourceId}`);
    expect(fetched.users.find(u => u.userId === userId)?.cards).toEqual(['1226', '0011']);
    // The other user's cards stay untouched
    expect(fetched.users.find(u => u.userId !== userId)?.cards).toEqual([]);
  });

  it('rejects invalid card numbers', async () => {
    await expectThrow(() =>
      session.patch(`/api/source/${sourceId}/user/${userId}`, { cards: ['12345'] }),
    );
    await expectThrow(() =>
      session.patch(`/api/source/${sourceId}/user/${userId}`, { cards: ['abcd'] }),
    );
  });

  it('fails for a user not attached to the source', async () => {
    await expectThrow(() =>
      session.patch(`/api/source/${sourceId}/user/999999`, { cards: ['1226'] }),
    );
  });
});
