import { SubscriptionResult, SubscriptionSearchCriteria } from 'shared/expense';
import { ObjectId } from 'shared/types';
import { DbTask } from 'server/data/Db.ts';
import { withSpan } from 'server/telemetry/Spans';

import { searchRecurringExpenses } from './RecurringExpenseDb';
import { searchReports } from './ReportDb';

export function searchSubscriptions(
  tx: DbTask,
  groupId: ObjectId,
  userId: ObjectId,
  criteria: SubscriptionSearchCriteria,
): Promise<SubscriptionResult> {
  return withSpan(
    'subscription.search',
    { 'app.group_id': groupId, 'app.user_id': userId },
    async () => {
      const recurringExpenses = await searchRecurringExpenses(tx, groupId, userId, criteria);
      const reports = await searchReports(tx, groupId, userId, criteria);
      return { recurringExpenses, reports };
    },
  );
}
