import { describe, expect, it } from 'bun:test';

import { ExpenseDivisionItem } from './Expense';
import {
  ExpenseDefaults,
  GeneratedRowAttributes,
  matchesGeneratedDefaults,
  mirrorEditToSubscription,
  sameDivision,
} from './Subscription';

const original = { title: 'Original', receiver: 'S-market', categoryId: 10 };
const updated = { title: 'Renamed', receiver: 'New receiver', categoryId: 20 };

describe('mirrorEditToSubscription', () => {
  it('follows the edit when filter and title are untouched from conversion', () => {
    const result = mirrorEditToSubscription(
      { filter: { categoryId: 10, receiver: 'S-market' }, title: 'Original' },
      original,
      updated,
    );
    expect(result).toEqual({
      filter: { categoryId: 20, receiver: 'New receiver' },
      title: 'Renamed',
    });
  });

  it('swaps the edited category inside an array filter, keeping the rest', () => {
    const result = mirrorEditToSubscription(
      { filter: { categoryId: [10, 30] }, title: 'Original' },
      original,
      updated,
    );
    expect(result.filter.categoryId).toEqual([20, 30]);
  });

  it('dedupes when the array filter already contains the new category', () => {
    const result = mirrorEditToSubscription(
      { filter: { categoryId: [10, 20] }, title: 'Original' },
      original,
      updated,
    );
    expect(result.filter.categoryId).toEqual([20]);
  });

  it('leaves the filter category alone when it does not reference the edited one', () => {
    const scalar = mirrorEditToSubscription(
      { filter: { categoryId: 30 }, title: 'Original' },
      original,
      updated,
    );
    expect(scalar.filter.categoryId).toBe(30);
    const array = mirrorEditToSubscription(
      { filter: { categoryId: [30, 40] }, title: 'Original' },
      original,
      updated,
    );
    expect(array.filter.categoryId).toEqual([30, 40]);
  });

  it('keeps a hand-tuned receiver and a custom card title', () => {
    const result = mirrorEditToSubscription(
      { filter: { categoryId: 10, receiver: 'Custom' }, title: 'My card' },
      original,
      updated,
    );
    expect(result).toEqual({
      filter: { categoryId: 20, receiver: 'Custom' },
      title: 'My card',
    });
  });

  it('drops the receiver constraint when the new receiver is empty', () => {
    const result = mirrorEditToSubscription(
      { filter: { categoryId: 10, receiver: 'S-market' }, title: 'Original' },
      original,
      { ...updated, receiver: '' },
    );
    expect(result.filter.receiver).toBeUndefined();
  });

  it('adds a receiver constraint when neither side had one', () => {
    const result = mirrorEditToSubscription(
      { filter: { categoryId: 10 }, title: 'Original' },
      { ...original, receiver: '' },
      updated,
    );
    expect(result.filter.receiver).toBe('New receiver');
  });
});

const defaults: ExpenseDefaults = {
  title: 'Netflix',
  receiver: 'Netflix Oy',
  sum: '15.99',
  type: 'expense',
  sourceId: 1,
  categoryId: 10,
  userId: 2,
  confirmed: true,
  description: null,
};

const generatedRow: GeneratedRowAttributes = {
  userId: 2,
  sourceId: 1,
  categoryId: 10,
  type: 'expense',
  title: 'Netflix',
  receiver: 'Netflix Oy',
  sum: '15.99',
  confirmed: true,
  description: null,
  groupingId: null,
  currencyId: null,
  splitId: null,
  statementSkip: false,
  hasStatementMatch: false,
};

describe('matchesGeneratedDefaults', () => {
  it('accepts a pristine generated row', () => {
    expect(matchesGeneratedDefaults(generatedRow, defaults)).toBe(true);
  });

  it('compares sums numerically, not textually', () => {
    expect(matchesGeneratedDefaults({ ...generatedRow, sum: '15.9900' }, defaults)).toBe(true);
  });

  it('treats a missing receiver and an empty one as equal', () => {
    const noReceiver = { ...defaults };
    delete noReceiver.receiver;
    expect(matchesGeneratedDefaults({ ...generatedRow, receiver: '' }, noReceiver)).toBe(true);
    expect(matchesGeneratedDefaults({ ...generatedRow, receiver: null }, noReceiver)).toBe(true);
  });

  it.each<[string, Partial<GeneratedRowAttributes>]>([
    ['grouping', { groupingId: 5 }],
    ['currency annotation', { currencyId: 3 }],
    ['split link', { splitId: '1a2b3c4d-0000-0000-0000-000000000000' }],
    ['statement skip', { statementSkip: true }],
    ['statement match', { hasStatementMatch: true }],
  ])('refuses a row decorated with a %s', (_name, decoration) => {
    expect(matchesGeneratedDefaults({ ...generatedRow, ...decoration }, defaults)).toBe(false);
  });

  it.each<[string, Partial<GeneratedRowAttributes>]>([
    ['sum', { sum: '16.99' }],
    ['title', { title: 'Renamed' }],
    ['receiver', { receiver: 'Other Oy' }],
    ['category', { categoryId: 11 }],
    ['source', { sourceId: 9 }],
    ['user', { userId: 3 }],
    ['confirmed flag', { confirmed: false }],
    ['description', { description: 'edited' }],
  ])('refuses a row with an edited %s', (_name, edit) => {
    expect(matchesGeneratedDefaults({ ...generatedRow, ...edit }, defaults)).toBe(false);
  });
});

describe('sameDivision', () => {
  const division: ExpenseDivisionItem[] = [
    { userId: 1, type: 'cost', sum: '-15.99' },
    { userId: 1, type: 'benefit', sum: '8.00' },
    { userId: 2, type: 'benefit', sum: '7.99' },
  ];

  it('accepts the same entries in a different order', () => {
    expect(sameDivision(division, [...division].reverse())).toBe(true);
  });

  it('compares sums numerically, not textually', () => {
    const padded = division.map(d => ({ ...d, sum: `${d.sum}0` }));
    expect(sameDivision(division, padded)).toBe(true);
  });

  it('refuses a differing sum', () => {
    const changed = [...division.slice(0, 2), { ...division[2], sum: '7.98' }];
    expect(sameDivision(division, changed)).toBe(false);
  });

  it('refuses a differing division type for the same user', () => {
    const changed = [...division.slice(0, 2), { ...division[2], type: 'cost' as const }];
    expect(sameDivision(division, changed)).toBe(false);
  });

  it('refuses divisions of different lengths', () => {
    expect(sameDivision(division, division.slice(0, 2))).toBe(false);
  });
});
