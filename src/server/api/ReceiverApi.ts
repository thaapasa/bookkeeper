import { Router } from 'express';
import { z } from 'zod';

import { ApiMessage } from 'shared/types';
import { Expenses } from 'server/data/Expenses';
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
    { query: ReceiverSearch },
    async (tx, session, { query }) =>
      (await Expenses.queryReceivers(tx, session.group.id, query.receiver)).map(
        r => r.receiver
      ),
    true
  );

  const RenameRequest = z.object({
    oldName: z.string().trim().min(1),
    newName: z.string().trim().min(1),
  });
  // PUT /api/receiver/rename
  api.putTx(
    '/rename',
    { body: RenameRequest, response: ApiMessage },
    async (tx, session, { body }) => {
      const count = await Expenses.renameReceiver(
        tx,
        session.group.id,
        body.oldName,
        body.newName
      );
      return { status: 'OK', message: `${count} expenses updated`, count };
    },
    true
  );

  return api.router;
}
