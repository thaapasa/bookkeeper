import { ExpenseQuery } from 'shared/expense';
import apiConnect from 'client/data/ApiConnect';
import { invalidateSubscriptionData } from 'client/data/query';
import { executeOperation } from 'client/util/ExecuteOperation';

import { UserPrompts } from '../dialog/DialogState';

/**
 * Save the current expense query as a non-recurring subscription. The
 * old `Report` concept now lives in the unified `subscriptions` table
 * — see docs/SUBSCRIPTIONS_REWORK_PLAN.md.
 */
export async function requestSaveReport(query: ExpenseQuery) {
  const title = await UserPrompts.promptText('Tilaus', 'Anna tilaukselle nimi');
  if (!title) return;
  // Strip the time-bounded fields out — a saved subscription should
  // keep matching new expenses, not freeze the originally-searched
  // window.
  const { startDate: _start, endDate: _end, ...filter } = query;
  void _start;
  void _end;
  await executeOperation(apiConnect.createSubscriptionFromFilter(title, filter), {
    success: 'Tilaus tallennettu',
    postProcess: () => invalidateSubscriptionData(),
  });
}
