import { ISOTimestamp } from 'shared/time';
import { db } from 'server/data/Db';

export interface TestState {
  testStart: ISOTimestamp;
  maxCategoryId: number;
  maxRecurringId: number;
}

export async function captureTestState(): Promise<TestState> {
  const row = await db.one<{ now: ISOTimestamp; maxCat: number | null; maxRec: number | null }>(
    `SELECT NOW() AS now,
            COALESCE((SELECT MAX(id) FROM categories), 0) AS "maxCat",
            COALESCE((SELECT MAX(id) FROM subscriptions), 0) AS "maxRec"`,
  );
  return {
    testStart: row.now,
    maxCategoryId: Number(row.maxCat ?? 0),
    maxRecurringId: Number(row.maxRec ?? 0),
  };
}

export async function cleanupTestDataSince(groupId: number, state: TestState): Promise<void> {
  await db.tx(async tx => {
    // Break expenses → subscriptions link before deleting either side.
    // Pre-step-5 the FK cascade flowed via the template expense; that path
    // is gone, so the cleanup has to null subscription_id explicitly.
    await tx.none(
      `UPDATE expenses SET subscription_id = NULL
       WHERE group_id = $/groupId/ AND created > $/testStart/ AND subscription_id IS NOT NULL`,
      { groupId, testStart: state.testStart },
    );
    await tx.none(`DELETE FROM expenses WHERE group_id = $/groupId/ AND created > $/testStart/`, {
      groupId,
      testStart: state.testStart,
    });
    await tx.none(
      `DELETE FROM subscriptions
       WHERE group_id = $/groupId/ AND id > $/maxRecurringId/`,
      { groupId, maxRecurringId: state.maxRecurringId },
    );
    await tx.none(
      `DELETE FROM categories
       WHERE group_id = $/groupId/ AND id > $/maxCategoryId/ AND parent_id IS NOT NULL`,
      { groupId, maxCategoryId: state.maxCategoryId },
    );
    await tx.none(`DELETE FROM categories WHERE group_id = $/groupId/ AND id > $/maxCategoryId/`, {
      groupId,
      maxCategoryId: state.maxCategoryId,
    });
  });
}
