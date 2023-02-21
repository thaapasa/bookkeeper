import { ITask } from 'pg-promise';

import { SubscriptionResult, SubscriptionSearchCriteria } from 'shared/expense';
import { ObjectId } from 'shared/types';

import { searchRecurringExpenses } from './RecurringExpenseDb';
import { searchReports } from './ReportDb';

export async function searchSubscriptions(
  tx: ITask<any>,
  groupId: ObjectId,
  userId: ObjectId,
  criteria: SubscriptionSearchCriteria
): Promise<SubscriptionResult> {
  const recurringExpenses = await searchRecurringExpenses(
    tx,
    groupId,
    userId,
    criteria
  );
  const reports = await searchReports(tx, groupId, userId, criteria);
  return { recurringExpenses, reports };
}
