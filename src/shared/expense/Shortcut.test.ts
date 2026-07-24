import { describe, expect, it } from 'bun:test';

import { ExpenseShortcut, ExpenseShortcutData, matchesStatementCounterparty } from './Shortcut';

function shortcut(statementTargets: string[]): ExpenseShortcut {
  return { id: 1, title: 'HSL', expense: {}, sortOrder: 1, statementTargets };
}

describe('matchesStatementCounterparty', () => {
  it('matches an exact counterparty', () => {
    expect(matchesStatementCounterparty(shortcut(['HSL MOBIILI']), 'HSL MOBIILI')).toBe(true);
  });

  it('matches a substring, so per-purchase suffixes are covered', () => {
    expect(matchesStatementCounterparty(shortcut(['Amazon.de']), 'Amazon.de*FX9W74Q55')).toBe(true);
  });

  it('matches case-insensitively', () => {
    expect(matchesStatementCounterparty(shortcut(['hsl mobiili']), 'HSL MOBIILI')).toBe(true);
    expect(matchesStatementCounterparty(shortcut(['PRIME VIDEO']), 'Prime Video -kauppa')).toBe(
      true,
    );
  });

  it('matches when any of several targets hits', () => {
    const s = shortcut(['PRISMA', 'S-MARKET']);
    expect(matchesStatementCounterparty(s, 'S-MARKET KAMPPI')).toBe(true);
    expect(matchesStatementCounterparty(s, 'K-MARKET')).toBe(false);
  });

  it('collapses whitespace runs on both sides', () => {
    const padded = 'EasyPark Oy         easypark.fi';
    expect(matchesStatementCounterparty(shortcut(['EasyPark Oy easypark.fi']), padded)).toBe(true);
    expect(matchesStatementCounterparty(shortcut(['Oy easypark']), padded)).toBe(true);
    expect(matchesStatementCounterparty(shortcut(['EasyPark  Oy']), 'EasyPark Oy')).toBe(true);
  });

  it('does not match without targets or counterparty', () => {
    expect(matchesStatementCounterparty(shortcut([]), 'HSL MOBIILI')).toBe(false);
    expect(matchesStatementCounterparty(shortcut(['HSL']), null)).toBe(false);
    expect(matchesStatementCounterparty(shortcut(['HSL']), '')).toBe(false);
  });
});

describe('ExpenseShortcutData', () => {
  it('accepts unique benefit user ids and an absent benefit', () => {
    expect(ExpenseShortcutData.safeParse({ benefit: [1, 2] }).success).toBe(true);
    expect(ExpenseShortcutData.safeParse({}).success).toBe(true);
  });

  it('rejects duplicate and empty benefit lists', () => {
    // A duplicate id would generate two expense_division rows with the
    // same (expense_id, user_id, type) and violate its PK on save.
    expect(ExpenseShortcutData.safeParse({ benefit: [1, 1] }).success).toBe(false);
    expect(ExpenseShortcutData.safeParse({ benefit: [] }).success).toBe(false);
  });
});
