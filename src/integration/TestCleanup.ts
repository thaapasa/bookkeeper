import { ISODate, ISOTimestamp } from 'shared/time';
import { db } from 'server/data/Db';

interface SubscriptionSnapshot {
  id: number;
  groupId: number;
  nextMissing: ISODate | null;
  occursUntil: ISODate | null;
}

export interface TestState {
  testStart: ISOTimestamp;
  maxCategoryId: number;
  maxRecurringId: number;
  maxGroupingId: number;
  /**
   * Snapshot of pre-existing subscriptions' generation cursors. Tests
   * that fetch a month trigger `createMissingRecurringExpenses` for
   * every group subscription with `next_missing` past, advancing those
   * cursors. Without restoring them the seed drifts forward across
   * runs, which makes test ordering load-bearing. `groupId` is captured
   * so the cleanup only restores cursors for the test's own group.
   */
  subscriptionCursors: SubscriptionSnapshot[];
}

export async function captureTestState(): Promise<TestState> {
  const meta = await db.one<{
    now: ISOTimestamp;
    maxCat: number | null;
    maxRec: number | null;
    maxGrouping: number | null;
  }>(
    `SELECT NOW() AS now,
            COALESCE((SELECT MAX(id) FROM categories), 0) AS "maxCat",
            COALESCE((SELECT MAX(id) FROM subscriptions), 0) AS "maxRec",
            COALESCE((SELECT MAX(id) FROM expense_groupings), 0) AS "maxGrouping"`,
  );
  const subs = await db.manyOrNone<SubscriptionSnapshot>(
    `SELECT id,
            group_id AS "groupId",
            next_missing AS "nextMissing",
            occurs_until AS "occursUntil"
       FROM subscriptions`,
  );
  return {
    testStart: meta.now,
    maxCategoryId: Number(meta.maxCat ?? 0),
    maxRecurringId: Number(meta.maxRec ?? 0),
    maxGroupingId: Number(meta.maxGrouping ?? 0),
    subscriptionCursors: subs,
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
    // Restore pre-existing subscriptions' generation cursors so tests
    // that run `createMissingRecurringExpenses` don't permanently
    // advance the seed. Only the test group's cursors are restored —
    // tests run against a single seeded group, so cursors captured
    // from other groups are out of scope.
    for (const sub of state.subscriptionCursors) {
      if (sub.groupId !== groupId) continue;
      await tx.none(
        `UPDATE subscriptions
            SET next_missing = $/nextMissing/::DATE,
                occurs_until = $/occursUntil/::DATE
            WHERE id = $/id/ AND group_id = $/groupId/`,
        sub,
      );
    }
    // Groupings are deleted by id across all groups — security tests create
    // groupings in other groups the caller is a member of (e.g. Herrakerho),
    // which a group_id filter would leak. `expense_grouping_categories`
    // cascades; `expenses.grouping_id` is ON DELETE SET NULL.
    await tx.none(`DELETE FROM expense_groupings WHERE id > $/maxGroupingId/`, {
      maxGroupingId: state.maxGroupingId,
    });
    await tx.none(
      `DELETE FROM categories
       WHERE group_id = $/groupId/ AND id > $/maxCategoryId/ AND parent_id IS NOT NULL`,
      { groupId, maxCategoryId: state.maxCategoryId },
    );
    await tx.none(`DELETE FROM categories WHERE group_id = $/groupId/ AND id > $/maxCategoryId/`, {
      groupId,
      maxCategoryId: state.maxCategoryId,
    });
    // Statement rows reference their upload, so delete rows first.
    await tx.none(
      `DELETE FROM statement_row WHERE group_id = $/groupId/ AND created > $/testStart/`,
      { groupId, testStart: state.testStart },
    );
    await tx.none(
      `DELETE FROM statement_upload WHERE group_id = $/groupId/ AND uploaded_at > $/testStart/`,
      { groupId, testStart: state.testStart },
    );
  });
}
