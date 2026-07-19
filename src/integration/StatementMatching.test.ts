import { afterEach, beforeEach, describe, expect, it } from 'bun:test';

import { ExpenseSplit } from 'shared/expense';
import {
  checkCreateStatus,
  fetchExpense,
  findCategoryId,
  findSourceId,
  logoutSession,
  newExpense,
  splitExpense,
} from 'shared/expense/test';
import { createTestClient, SessionWithControl } from 'shared/net/test';
import { StatementMatchingData, StatementUploadResult } from 'shared/statement';
import { OP_ROWS, opCsv } from 'shared/statement/test/StatementFixtures';
import { Money } from 'shared/util';
import { logger } from 'server/Logger';

import { captureTestState, cleanupTestDataSince, TestState } from './TestCleanup';

/**
 * OP fixture rows in the 2026-05 matching window (effective dates):
 * 2026-05-01 (card, -12.90, purchase date from OSTOPVM), 2026-05-03
 * (-250.00), 2026-05-15 (+2500.00), 2026-05-28 (-400.00). The 2026-06-28
 * row falls outside the window.
 */
describe('statement matching', () => {
  let session: SessionWithControl;
  let state: TestState;
  let sourceId: number;
  const client = createTestClient({ logger });

  const getMatching = () =>
    session.get<StatementMatchingData>('/api/statement/matching', {
      sourceId: `${sourceId}`,
      month: '2026-05',
    });

  beforeEach(async () => {
    session = await client.getSession('sale', 'salasana');
    state = await captureTestState();
    sourceId = findSourceId('Yhteinen tili', session);
    await session.patch(`/api/source/${sourceId}`, { statementFormat: 'op' });
    await session.post<StatementUploadResult>(`/api/statement/upload/${sourceId}`, {
      filename: 'op.csv',
      content: opCsv(OP_ROWS),
    });
  });

  afterEach(async () => {
    await session.patch(`/api/source/${sourceId}`, { statementFormat: null });
    await cleanupTestDataSince(session.group.id, state);
    await logoutSession(session);
  });

  it('returns both sides windowed to the month', async () => {
    const expenseId = checkCreateStatus(
      await newExpense(session, { date: '2026-05-01', sum: '12.90' }),
    );
    const data = await getMatching();
    expect(data.statementRows).toHaveLength(4);
    // Card row's effective date comes from the parsed purchase date
    expect(data.statementRows[0]).toMatchObject({
      purchaseDate: '2026-05-01',
      valueDate: '2026-05-02',
      amount: '-12.90',
      matchedExpenseIds: [],
      skipped: false,
    });
    expect(data.expenses).toHaveLength(1);
    expect(data.expenses[0]).toMatchObject({
      id: expenseId,
      date: '2026-05-01',
      sum: '12.90',
      type: 'expense',
      statementSkip: false,
      matchedStatementRowIds: [],
    });
  });

  it('matches a statement row to multiple expenses and unmatches', async () => {
    const e1 = checkCreateStatus(await newExpense(session, { date: '2026-05-03', sum: '200.00' }));
    const e2 = checkCreateStatus(await newExpense(session, { date: '2026-05-03', sum: '50.00' }));
    const before = await getMatching();
    const row = before.statementRows.find(r => r.amount === '-250.00')!;

    await session.post('/api/statement/match', {
      statementRowIds: [row.id],
      expenseIds: [e1, e2],
    });
    const matched = await getMatching();
    expect(matched.statementRows.find(r => r.id === row.id)?.matchedExpenseIds.sort()).toEqual(
      [e1, e2].sort(),
    );
    expect(matched.expenses.map(e => e.matchedStatementRowIds)).toEqual([[row.id], [row.id]]);

    // Re-linking an existing pair is a no-op, not an error
    await session.post('/api/statement/match', { statementRowIds: [row.id], expenseIds: [e1] });
    const again = await getMatching();
    expect(again.statementRows.find(r => r.id === row.id)?.matchedExpenseIds.sort()).toEqual(
      [e1, e2].sort(),
    );

    await session.del(`/api/statement/match/statement/${row.id}`);
    const unmatched = await getMatching();
    expect(unmatched.statementRows.find(r => r.id === row.id)?.matchedExpenseIds).toEqual([]);
    expect(unmatched.expenses.map(e => e.matchedStatementRowIds)).toEqual([[], []]);
  });

  it('unmatches a single expense', async () => {
    const e1 = checkCreateStatus(await newExpense(session, { date: '2026-05-03', sum: '200.00' }));
    const e2 = checkCreateStatus(await newExpense(session, { date: '2026-05-03', sum: '50.00' }));
    const { statementRows } = await getMatching();
    const row = statementRows.find(r => r.amount === '-250.00')!;
    await session.post('/api/statement/match', { statementRowIds: [row.id], expenseIds: [e1, e2] });

    await session.del(`/api/statement/match/expense/${e1}`);
    const data = await getMatching();
    expect(data.statementRows.find(r => r.id === row.id)?.matchedExpenseIds).toEqual([e2]);
  });

  it('confirms bulk matches', async () => {
    const e1 = checkCreateStatus(await newExpense(session, { date: '2026-05-01', sum: '12.90' }));
    const e2 = checkCreateStatus(await newExpense(session, { date: '2026-05-28', sum: '400.00' }));
    const { statementRows } = await getMatching();
    const r1 = statementRows.find(r => r.amount === '-12.90')!;
    const r2 = statementRows.find(r => r.amount === '-400.00')!;

    await session.post('/api/statement/match/bulk', {
      matches: [
        { statementRowIds: [r1.id], expenseIds: [e1] },
        { statementRowIds: [r2.id], expenseIds: [e2] },
      ],
    });
    const data = await getMatching();
    expect(data.expenses.find(e => e.id === e1)?.matchedStatementRowIds).toEqual([r1.id]);
    expect(data.expenses.find(e => e.id === e2)?.matchedStatementRowIds).toEqual([r2.id]);
  });

  it('matches one expense to multiple statement rows', async () => {
    // One 262.90 € purchase paid with two bank payments (12.90 + 250.00)
    const e = checkCreateStatus(await newExpense(session, { date: '2026-05-02', sum: '262.90' }));
    const { statementRows } = await getMatching();
    const r1 = statementRows.find(r => r.amount === '-12.90')!;
    const r2 = statementRows.find(r => r.amount === '-250.00')!;

    await session.post('/api/statement/match', {
      statementRowIds: [r1.id, r2.id],
      expenseIds: [e],
    });
    const data = await getMatching();
    expect(data.expenses[0].matchedStatementRowIds.sort()).toEqual([r1.id, r2.id].sort());
    expect(data.statementRows.find(r => r.id === r1.id)?.matchedExpenseIds).toEqual([e]);
    expect(data.statementRows.find(r => r.id === r2.id)?.matchedExpenseIds).toEqual([e]);

    // A group can be extended incrementally: link a third row to the
    // already-matched expense
    const r3 = data.statementRows.find(r => r.amount === '-400.00')!;
    await session.post('/api/statement/match', { statementRowIds: [r3.id], expenseIds: [e] });
    const extended = await getMatching();
    expect(extended.expenses[0].matchedStatementRowIds.sort()).toEqual(
      [r1.id, r2.id, r3.id].sort(),
    );

    // Unmatching one row leaves the expense's other links intact
    await session.del(`/api/statement/match/statement/${r3.id}`);
    const trimmed = await getMatching();
    expect(trimmed.expenses[0].matchedStatementRowIds.sort()).toEqual([r1.id, r2.id].sort());
  });

  it('includes matched statement rows in expense details', async () => {
    const e = checkCreateStatus(await newExpense(session, { date: '2026-05-01', sum: '12.90' }));
    const before = await fetchExpense(session, e);
    expect(before.matchedStatementRows).toEqual([]);

    const { statementRows } = await getMatching();
    const row = statementRows.find(r => r.amount === '-12.90')!;
    await session.post('/api/statement/match', { statementRowIds: [row.id], expenseIds: [e] });

    const after = await fetchExpense(session, e);
    expect(after.matchedStatementRows).toHaveLength(1);
    expect(after.matchedStatementRows[0]).toMatchObject({
      id: row.id,
      amount: '-12.90',
      counterparty: 'MEGASTORE HELSINKI',
      purchaseDate: '2026-05-01',
    });
  });

  it('rejects matching to an expense from another source', async () => {
    const otherSource = findSourceId('Jennin tili', session);
    const e = checkCreateStatus(
      await newExpense(session, { date: '2026-05-03', sum: '250.00', sourceId: otherSource }),
    );
    const { statementRows } = await getMatching();
    const row = statementRows.find(r => r.amount === '-250.00')!;
    await expect(
      session.post('/api/statement/match', { statementRowIds: [row.id], expenseIds: [e] }),
    ).rejects.toMatchObject({ code: 'STATEMENT_MATCH_SOURCE_MISMATCH' });
  });

  it('skips and unskips, with consistency rules', async () => {
    const e = checkCreateStatus(await newExpense(session, { date: '2026-05-01', sum: '12.90' }));
    const { statementRows } = await getMatching();
    const row = statementRows.find(r => r.amount === '-12.90')!;

    await session.patch(`/api/statement/row/${row.id}/skip`, { skipped: true });
    await session.patch(`/api/statement/expense/${e}/skip`, { skipped: true });
    let data = await getMatching();
    expect(data.statementRows.find(r => r.id === row.id)?.skipped).toEqual(true);
    expect(data.expenses[0].statementSkip).toEqual(true);

    // Matching clears the skip flags on both sides
    await session.post('/api/statement/match', { statementRowIds: [row.id], expenseIds: [e] });
    data = await getMatching();
    expect(data.statementRows.find(r => r.id === row.id)?.skipped).toEqual(false);
    expect(data.expenses[0].statementSkip).toEqual(false);

    // Skipping a matched item is rejected
    await expect(
      session.patch(`/api/statement/row/${row.id}/skip`, { skipped: true }),
    ).rejects.toMatchObject({ code: 'STATEMENT_ROW_MATCHED' });
    await expect(
      session.patch(`/api/statement/expense/${e}/skip`, { skipped: true }),
    ).rejects.toMatchObject({ code: 'EXPENSE_MATCHED' });

    // ...also with multiple links on the item (many-to-many): still the
    // typed rejection, not a multiple-rows query error
    const e2 = checkCreateStatus(await newExpense(session, { date: '2026-05-01', sum: '5.00' }));
    const row2 = data.statementRows.find(r => r.amount === '-250.00')!;
    await session.post('/api/statement/match', {
      statementRowIds: [row.id, row2.id],
      expenseIds: [e, e2],
    });
    await expect(
      session.patch(`/api/statement/row/${row.id}/skip`, { skipped: true }),
    ).rejects.toMatchObject({ code: 'STATEMENT_ROW_MATCHED' });
    await expect(
      session.patch(`/api/statement/expense/${e}/skip`, { skipped: true }),
    ).rejects.toMatchObject({ code: 'EXPENSE_MATCHED' });
  });

  describe('splitting a matched expense', () => {
    /** Builds one split part; the split endpoint requires a full division. */
    const splitPart = (title: string, sum: string): ExpenseSplit => ({
      sourceId,
      categoryId: findCategoryId('Ruoka', session),
      title,
      sum,
      division: [
        { type: 'benefit', sum, userId: session.user.id },
        { type: 'cost', sum: Money.from(sum).negate().toString(), userId: session.user.id },
      ],
    });

    const partsByTitle = (data: StatementMatchingData, titles: string[]) =>
      titles.map(t => data.expenses.find(e => e.title === t)!);

    it('keeps the match on both parts when split in two', async () => {
      const e = checkCreateStatus(
        await newExpense(session, { date: '2026-05-03', sum: '250.00', title: 'Kokonainen' }),
      );
      const { statementRows } = await getMatching();
      const row = statementRows.find(r => r.amount === '-250.00')!;
      await session.post('/api/statement/match', { statementRowIds: [row.id], expenseIds: [e] });

      await splitExpense(session, e, [splitPart('Osa1', '100.00'), splitPart('Osa2', '150.00')]);

      const data = await getMatching();
      const parts = partsByTitle(data, ['Osa1', 'Osa2']);
      for (const part of parts) {
        expect(part.matchedStatementRowIds).toEqual([row.id]);
      }
      expect(data.statementRows.find(r => r.id === row.id)?.matchedExpenseIds.sort()).toEqual(
        parts.map(p => p.id).sort(),
      );
      // The deleted original no longer appears on either side
      expect(data.expenses.find(ex => ex.id === e)).toBeUndefined();
      // The expense details view also shows the inherited match
      const details = await fetchExpense(session, parts[0].id);
      expect(details.matchedStatementRows.map(r => r.id)).toEqual([row.id]);
    });

    it('keeps the match on every part when split in three', async () => {
      const e = checkCreateStatus(
        await newExpense(session, { date: '2026-05-28', sum: '400.00', title: 'Kokonainen' }),
      );
      const { statementRows } = await getMatching();
      const row = statementRows.find(r => r.amount === '-400.00')!;
      await session.post('/api/statement/match', { statementRowIds: [row.id], expenseIds: [e] });

      await splitExpense(session, e, [
        splitPart('Osa1', '150.00'),
        splitPart('Osa2', '150.00'),
        splitPart('Osa3', '100.00'),
      ]);

      const data = await getMatching();
      const parts = partsByTitle(data, ['Osa1', 'Osa2', 'Osa3']);
      for (const part of parts) {
        expect(part.matchedStatementRowIds).toEqual([row.id]);
      }
      expect(data.statementRows.find(r => r.id === row.id)?.matchedExpenseIds.sort()).toEqual(
        parts.map(p => p.id).sort(),
      );
    });

    it('keeps the statement-skip flag on all parts when a skipped expense is split', async () => {
      const e = checkCreateStatus(
        await newExpense(session, { date: '2026-05-10', sum: '30.00', title: 'Ohitettu' }),
      );
      await session.patch(`/api/statement/expense/${e}/skip`, { skipped: true });

      await splitExpense(session, e, [splitPart('Osa1', '10.00'), splitPart('Osa2', '20.00')]);

      const data = await getMatching();
      const parts = partsByTitle(data, ['Osa1', 'Osa2']);
      for (const part of parts) {
        expect(part.statementSkip).toEqual(true);
        expect(part.matchedStatementRowIds).toEqual([]);
      }
    });

    it('keeps all matches when the expense is matched to multiple statement rows', async () => {
      // One purchase paid with two bank payments (12.90 + 250.00)
      const e = checkCreateStatus(
        await newExpense(session, { date: '2026-05-02', sum: '262.90', title: 'Kokonainen' }),
      );
      const { statementRows } = await getMatching();
      const r1 = statementRows.find(r => r.amount === '-12.90')!;
      const r2 = statementRows.find(r => r.amount === '-250.00')!;
      await session.post('/api/statement/match', {
        statementRowIds: [r1.id, r2.id],
        expenseIds: [e],
      });

      await splitExpense(session, e, [splitPart('Osa1', '200.00'), splitPart('Osa2', '62.90')]);

      const data = await getMatching();
      const parts = partsByTitle(data, ['Osa1', 'Osa2']);
      for (const part of parts) {
        expect(part.matchedStatementRowIds.sort()).toEqual([r1.id, r2.id].sort());
      }
      for (const row of [r1, r2]) {
        expect(data.statementRows.find(r => r.id === row.id)?.matchedExpenseIds.sort()).toEqual(
          parts.map(p => p.id).sort(),
        );
      }
    });
  });

  it('cascades match removal when the expense is deleted', async () => {
    const e = checkCreateStatus(await newExpense(session, { date: '2026-05-01', sum: '12.90' }));
    const { statementRows } = await getMatching();
    const row = statementRows.find(r => r.amount === '-12.90')!;
    await session.post('/api/statement/match', { statementRowIds: [row.id], expenseIds: [e] });

    await session.del(`/api/expense/${e}`);
    const data = await getMatching();
    expect(data.statementRows.find(r => r.id === row.id)?.matchedExpenseIds).toEqual([]);
  });
});
