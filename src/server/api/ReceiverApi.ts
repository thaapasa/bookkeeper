import { Router } from 'express';
import { z } from 'zod';

import { CountResponse } from 'shared/types';
import { queryReceivers, renameReceiver } from 'server/data/BasicExpenseDb';
import { createValidatingRouter } from 'server/server/ValidatingRouter';

/**
 * Creates receiver API router.
 * Assumed attach path: `/api/receiver`
 */
export function createReceiverApi() {
  const api = createValidatingRouter(Router());

  const ReceiverSearch = z.object({
    receiver: z.string().min(3).max(50),
  });
  // GET /api/receiver/query?receiver=[query]
  api.getTx(
    '/query',
    { query: ReceiverSearch, groupRequired: true },
    async (tx, session, { query }) =>
      (await queryReceivers(tx, session.group.id, query.receiver)).map(r => r.receiver),
  );

  const RenameRequest = z.object({
    oldName: z.string().trim().min(1),
    newName: z.string().trim().min(1),
  });
  // PUT /api/receiver/rename
  api.putTx(
    '/rename',
    { body: RenameRequest, response: CountResponse, groupRequired: true },
    async (tx, session, { body }) => {
      const count = await renameReceiver(tx, session.group.id, body.oldName, body.newName);
      return { status: 'OK', message: `${count} expenses updated`, count };
    },
  );

  return api.router;
}
