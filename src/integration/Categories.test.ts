import { expect, describe, it, beforeEach, afterEach } from "bun:test";

import { cleanup, newCategory } from 'shared/expense/test';
import { createTestClient, SessionWithControl } from 'shared/net/test';
import { expectThrow } from 'shared/util/test';

/* eslint-disable @typescript-eslint/no-non-null-assertion */

describe('categories', () => {
  let session: SessionWithControl;
  const client = createTestClient();

  beforeEach(async () => {
    session = await client.getSession('sale', 'salasana');
  });

  afterEach(async () => {
    await cleanup(session);
  });

  it('should not allow sub-sub-categories to be created', async () => {
    const c1 = await newCategory(session, { name: 'Pohja', parentId: 0 });
    expect(c1.categoryId).toBeGreaterThan(0);
    const c2 = await newCategory(session, {
      name: 'Keski',
      parentId: c1.categoryId!,
    });
    expect(c2.categoryId).toBeGreaterThan(0);
    await expectThrow(() =>
      newCategory(session, { name: 'Alin', parentId: c2.categoryId! })
    );
  });
});
