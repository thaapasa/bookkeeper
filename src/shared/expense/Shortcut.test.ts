import { describe, expect, it } from 'bun:test';

import { ExpenseShortcut, matchesStatementCounterparty } from './Shortcut';

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

  it('does not match without targets or counterparty', () => {
    expect(matchesStatementCounterparty(shortcut([]), 'HSL MOBIILI')).toBe(false);
    expect(matchesStatementCounterparty(shortcut(['HSL']), null)).toBe(false);
    expect(matchesStatementCounterparty(shortcut(['HSL']), '')).toBe(false);
  });
});
