import { ISOTimestamp } from 'shared/time';
import { db } from 'server/data/Db';

export interface TestState {
  testStart: ISOTimestamp;
  maxCategoryId: number;
}

export async function captureTestState(): Promise<TestState> {
  const row = await db.one<{ now: ISOTimestamp; max: number | null }>(
    `SELECT NOW() AS now, COALESCE((SELECT MAX(id) FROM categories), 0) AS max`,
  );
  return {
    testStart: row.now,
    maxCategoryId: Number(row.max ?? 0),
  };
}

export async function cleanupTestDataSince(groupId: number, state: TestState): Promise<void> {
  await db.tx(async tx => {
    await tx.none(
      `UPDATE expenses SET recurring_expense_id = NULL
       WHERE group_id = $/groupId/ AND created > $/testStart/ AND recurring_expense_id IS NOT NULL`,
      { groupId, testStart: state.testStart },
    );
    await tx.none(`DELETE FROM expenses WHERE group_id = $/groupId/ AND created > $/testStart/`, {
      groupId,
      testStart: state.testStart,
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
  });
}
