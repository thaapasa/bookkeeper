import { describe, expect, it } from 'bun:test';

import { mirrorEditToSubscription } from './Subscription';

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
