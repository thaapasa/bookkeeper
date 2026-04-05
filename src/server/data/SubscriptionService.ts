import { SubscriptionResult, SubscriptionSearchCriteria } from 'shared/expense';
import { ObjectId } from 'shared/types';
import { DbTask } from 'server/data/Db.ts';

import { searchRecurringExpenses } from './RecurringExpenseDb';
import { searchReports } from './ReportDb';

export async function searchSubscriptions(
  tx: DbTask,
  groupId: ObjectId,
  userId: ObjectId,
  criteria: SubscriptionSearchCriteria,
): Promise<SubscriptionResult> {
  const recurringExpenses = await searchRecurringExpenses(tx, groupId, userId, criteria);
  const reports = await searchReports(tx, groupId, userId, criteria);
  return { recurringExpenses, reports };
}
