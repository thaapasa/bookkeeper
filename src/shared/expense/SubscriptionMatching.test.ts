import { describe, expect, it } from 'bun:test';

import {
  assignExpensesToSubscriptions,
  buildSubscriptionFilter,
  MatchableExpense,
  pickWinningFilter,
  scoreFilter,
} from './SubscriptionMatching';

const exp = (overrides: Partial<MatchableExpense> = {}): MatchableExpense => ({
  id: 1,
  date: '2026-04-01',
  type: 'expense',
  sum: '10.00',
  title: 'Netflix',
  receiver: 'Netflix',
  userId: 1,
  categoryId: 38,
  confirmed: true,
  ...overrides,
});

describe('SubscriptionMatching.scoreFilter', () => {
  it('matches an exact category and scores 20', () => {
    const filter = buildSubscriptionFilter(1, { categoryId: 38 }, []);
    expect(scoreFilter(filter, exp())).toBe(20);
  });

  it('returns null when category does not match', () => {
    const filter = buildSubscriptionFilter(1, { categoryId: 99 }, []);
    expect(scoreFilter(filter, exp())).toBeNull();
  });

  it('scores subtree match with 10 (excludes the direct id)', () => {
    const filter = buildSubscriptionFilter(
      2,
      { categoryId: 30, includeSubCategories: true },
      [30, 38, 39],
    );
    expect(scoreFilter(filter, exp({ categoryId: 38 }))).toBe(10);
  });

  it('prefers direct match over subtree when both apply', () => {
    const filter = buildSubscriptionFilter(
      2,
      { categoryId: 38, includeSubCategories: true },
      [38, 39],
    );
    expect(scoreFilter(filter, exp({ categoryId: 38 }))).toBe(20);
  });

  it('adds receiver weight (15) on substring ILIKE match', () => {
    const filter = buildSubscriptionFilter(1, { receiver: 'flix' }, []);
    expect(scoreFilter(filter, exp())).toBe(15);
  });

  it('rejects when receiver does not match', () => {
    const filter = buildSubscriptionFilter(1, { receiver: 'Spotify' }, []);
    expect(scoreFilter(filter, exp())).toBeNull();
  });

  it('combines category + receiver to score 35', () => {
    const filter = buildSubscriptionFilter(1, { categoryId: 38, receiver: 'Net' }, []);
    expect(scoreFilter(filter, exp())).toBe(35);
  });

  it('treats missing receiver as a non-match for receiver constraints', () => {
    const filter = buildSubscriptionFilter(1, { receiver: 'Netflix' }, []);
    expect(scoreFilter(filter, exp({ receiver: '' }))).toBeNull();
  });

  it('matches title ILIKE separately from receiver', () => {
    const filter = buildSubscriptionFilter(1, { title: 'flix' }, []);
    expect(scoreFilter(filter, exp())).toBe(15);
  });

  it('search matches against either title or receiver and scores 10', () => {
    const filter = buildSubscriptionFilter(1, { search: 'flix' }, []);
    expect(scoreFilter(filter, exp({ title: 'Cash', receiver: 'Netflix' }))).toBe(10);
    expect(scoreFilter(filter, exp({ title: 'Netflix Plus', receiver: '' }))).toBe(10);
    expect(scoreFilter(filter, exp({ title: 'Cash', receiver: 'Spotify' }))).toBeNull();
  });

  it('type filter rejects non-matching types', () => {
    const filter = buildSubscriptionFilter(1, { type: 'income' }, []);
    expect(scoreFilter(filter, exp({ type: 'expense' }))).toBeNull();
    expect(scoreFilter(filter, exp({ type: 'income' }))).toBe(5);
  });

  it('userId filter respects exact match', () => {
    const filter = buildSubscriptionFilter(1, { userId: 1 }, []);
    expect(scoreFilter(filter, exp({ userId: 1 }))).toBe(5);
    expect(scoreFilter(filter, exp({ userId: 2 }))).toBeNull();
  });

  it('confirmed filter rejects opposite values', () => {
    const filter = buildSubscriptionFilter(1, { confirmed: true }, []);
    expect(scoreFilter(filter, exp({ confirmed: false }))).toBeNull();
    expect(scoreFilter(filter, exp({ confirmed: true }))).toBe(2);
  });

  it('date range bounds the filter (no points)', () => {
    const filter = buildSubscriptionFilter(
      1,
      { categoryId: 38, startDate: '2026-01-01', endDate: '2026-12-31' },
      [],
    );
    expect(scoreFilter(filter, exp({ date: '2026-04-01' }))).toBe(20);
    expect(scoreFilter(filter, exp({ date: '2025-12-31' }))).toBeNull();
    expect(scoreFilter(filter, exp({ date: '2027-01-01' }))).toBeNull();
  });

  it('matches a fully empty filter against everything (score 0)', () => {
    const filter = buildSubscriptionFilter(1, {}, []);
    expect(scoreFilter(filter, exp())).toBe(0);
  });
});

describe('SubscriptionMatching.pickWinningFilter', () => {
  it('picks the highest-scoring filter', () => {
    const broad = buildSubscriptionFilter(1, { categoryId: 38 }, []);
    const narrow = buildSubscriptionFilter(2, { categoryId: 38, receiver: 'Netflix' }, []);
    expect(pickWinningFilter(exp(), [broad, narrow])).toBe(narrow);
  });

  it('on tie prefers the older subscription (lower id)', () => {
    const a = buildSubscriptionFilter(7, { categoryId: 38 }, []);
    const b = buildSubscriptionFilter(3, { categoryId: 38 }, []);
    expect(pickWinningFilter(exp(), [a, b])).toBe(b);
  });

  it('returns null when no filter matches', () => {
    const f = buildSubscriptionFilter(1, { categoryId: 99 }, []);
    expect(pickWinningFilter(exp(), [f])).toBeNull();
  });
});

describe('SubscriptionMatching.assignExpensesToSubscriptions', () => {
  it('routes each expense to the most specific filter', () => {
    const broad = buildSubscriptionFilter(
      1,
      { categoryId: 30, includeSubCategories: true },
      [30, 38, 39],
    );
    const narrow = buildSubscriptionFilter(2, { categoryId: 38, receiver: 'Netflix' }, []);
    const expenses = [
      exp({ id: 1, categoryId: 38, receiver: 'Netflix' }),
      exp({ id: 2, categoryId: 39, receiver: 'Spotify' }),
      exp({ id: 3, categoryId: 99, receiver: 'Other' }),
    ];
    const wins = assignExpensesToSubscriptions(expenses, [broad, narrow]);
    expect(wins.get(narrow.id)?.map(e => e.id)).toEqual([1]);
    expect(wins.get(broad.id)?.map(e => e.id)).toEqual([2]);
    expect([...wins.keys()].length).toBe(2);
  });

  it('omits expenses that match no filter', () => {
    const f = buildSubscriptionFilter(1, { categoryId: 38 }, []);
    const wins = assignExpensesToSubscriptions([exp({ categoryId: 99 })], [f]);
    expect(wins.size).toBe(0);
  });
});
