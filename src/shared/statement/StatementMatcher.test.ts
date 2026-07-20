import { describe, expect, it } from 'bun:test';

import { MatchableExpense, MatchingStatementRow } from './StatementMatch';
import { suggestStatementMatches } from './StatementMatcher';

let nextId = 1;

const expense = (partial: Partial<MatchableExpense>): MatchableExpense => ({
  id: nextId++,
  date: '2026-05-10',
  sum: '25.50',
  type: 'expense',
  title: null,
  receiver: null,
  userId: 1,
  splitId: null,
  subscriptionId: null,
  confirmed: true,
  statementSkip: false,
  matchedStatementRowIds: [],
  ...partial,
});

const row = (partial: Partial<MatchingStatementRow>): MatchingStatementRow => ({
  id: nextId++,
  sourceId: 1,
  uploadId: 1,
  bookingDate: '2026-05-12',
  valueDate: '2026-05-10',
  purchaseDate: null,
  amount: '-25.50',
  type: 'KORTTIOSTO',
  counterparty: null,
  counterpartyAccount: null,
  reference: null,
  message: null,
  archiveId: null,
  rawLine: '',
  skipped: false,
  credit: false,
  matchedExpenseIds: [],
  ...partial,
});

describe('suggestStatementMatches', () => {
  it('suggests a unique date+sum pair', () => {
    const e = expense({});
    const r = row({});
    expect(suggestStatementMatches([e], [r])).toEqual([
      { statementRowIds: [r.id], expenseIds: [e.id] },
    ]);
  });

  it('uses the purchase date over the value date', () => {
    const e = expense({ date: '2026-05-08' });
    const r = row({ valueDate: '2026-05-10', purchaseDate: '2026-05-08' });
    expect(suggestStatementMatches([e], [r])).toHaveLength(1);
  });

  it('requires the exact date', () => {
    const e = expense({ date: '2026-05-09' });
    const r = row({ valueDate: '2026-05-10' });
    expect(suggestStatementMatches([e], [r])).toEqual([]);
  });

  it('requires the exact sum', () => {
    expect(suggestStatementMatches([expense({ sum: '25.00' })], [row({})])).toEqual([]);
  });

  it('matches signs by expense type', () => {
    // An income should match a positive statement amount, not a negative one
    const income = expense({ sum: '25.50', type: 'income' });
    expect(suggestStatementMatches([income], [row({ amount: '-25.50' })])).toEqual([]);
    const r = row({ amount: '25.50' });
    expect(suggestStatementMatches([income], [r])).toEqual([
      { statementRowIds: [r.id], expenseIds: [income.id] },
    ]);
    // Transfers pay out of the account, like expenses
    const transfer = expense({ sum: '700.00', type: 'transfer' });
    const out = row({ amount: '-700.00' });
    expect(suggestStatementMatches([transfer], [out])).toEqual([
      { statementRowIds: [out.id], expenseIds: [transfer.id] },
    ]);
  });

  it('leaves ambiguous buckets unsuggested', () => {
    // Two identical expenses, one row: cannot pick
    expect(suggestStatementMatches([expense({}), expense({})], [row({})])).toEqual([]);
    // One expense, two identical rows: cannot pick
    expect(suggestStatementMatches([expense({})], [row({}), row({})])).toEqual([]);
  });

  it('ignores already matched, and skipped, items', () => {
    const matched = expense({ matchedStatementRowIds: [123] });
    const skippedExpense = expense({ statementSkip: true });
    const matchedRow = row({ matchedExpenseIds: [456] });
    const skippedRow = row({ skipped: true });
    expect(suggestStatementMatches([matched, skippedExpense], [row({})])).toEqual([]);
    expect(suggestStatementMatches([expense({})], [matchedRow, skippedRow])).toEqual([]);
    // ...but their absence disambiguates the remaining pair
    const e = expense({});
    const r = row({});
    expect(suggestStatementMatches([e, matched], [r, matchedRow])).toEqual([
      { statementRowIds: [r.id], expenseIds: [e.id] },
    ]);
  });

  it('treats split parts as one unit with the total sum', () => {
    // One purchase split into two expense rows; bank has one payment
    const splitId = '5c7f0e40-0000-0000-0000-000000000001';
    const e1 = expense({ sum: '10.00', splitId });
    const e2 = expense({ sum: '15.50', splitId });
    const r = row({ amount: '-25.50' });
    expect(suggestStatementMatches([e1, e2], [r])).toEqual([
      { statementRowIds: [r.id], expenseIds: [e1.id, e2.id] },
    ]);
    // Neither part matches the total alone
    expect(suggestStatementMatches([e1, e2], [row({ amount: '-10.00' })])).toEqual([]);
  });

  it('does not combine unrelated expenses without a split id', () => {
    const e1 = expense({ sum: '10.00' });
    const e2 = expense({ sum: '15.50' });
    expect(suggestStatementMatches([e1, e2], [row({ amount: '-25.50' })])).toEqual([]);
  });

  it('does not combine expenses from different splits', () => {
    const e1 = expense({ sum: '10.00', splitId: '5c7f0e40-0000-0000-0000-00000000000a' });
    const e2 = expense({ sum: '15.50', splitId: '5c7f0e40-0000-0000-0000-00000000000b' });
    expect(suggestStatementMatches([e1, e2], [row({ amount: '-25.50' })])).toEqual([]);
  });

  it('skips split units whose parts have different dates', () => {
    const splitId = '5c7f0e40-0000-0000-0000-000000000002';
    const e1 = expense({ sum: '10.00', splitId, date: '2026-05-10' });
    const e2 = expense({ sum: '15.50', splitId, date: '2026-05-11' });
    expect(suggestStatementMatches([e1, e2], [row({ amount: '-25.50' })])).toEqual([]);
  });

  it('excludes matched and skipped parts from the split total', () => {
    // One part already matched elsewhere: the remaining part alone no
    // longer sums to the payment, so nothing is suggested
    const splitId = '5c7f0e40-0000-0000-0000-000000000003';
    const e1 = expense({ sum: '10.00', splitId, matchedStatementRowIds: [999] });
    const e2 = expense({ sum: '15.50', splitId });
    expect(suggestStatementMatches([e1, e2], [row({ amount: '-25.50' })])).toEqual([]);
    // ...but the remaining part can 1:1 match its own row
    const r = row({ amount: '-15.50' });
    expect(suggestStatementMatches([e1, e2], [r])).toEqual([
      { statementRowIds: [r.id], expenseIds: [e2.id] },
    ]);
  });

  it('suggests independent pairs on different dates', () => {
    const e1 = expense({ date: '2026-05-01', sum: '10.00' });
    const e2 = expense({ date: '2026-05-02', sum: '10.00' });
    const r1 = row({ valueDate: '2026-05-01', amount: '-10.00' });
    const r2 = row({ valueDate: '2026-05-02', amount: '-10.00' });
    const suggestions = suggestStatementMatches([e1, e2], [r1, r2]);
    expect(suggestions).toHaveLength(2);
    expect(suggestions).toContainEqual({ statementRowIds: [r1.id], expenseIds: [e1.id] });
    expect(suggestions).toContainEqual({ statementRowIds: [r2.id], expenseIds: [e2.id] });
  });
});
