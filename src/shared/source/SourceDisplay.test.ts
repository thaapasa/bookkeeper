import { describe, expect, it } from 'bun:test';

import { Source, UserShare } from '../types/Source';
import { sourceDisplayName } from './SourceDisplay';

function source(users: UserShare[]): Source {
  return {
    id: 1,
    name: 'Yhteinen tili',
    abbreviation: null,
    shares: users.length,
    users,
    statementFormat: 'op',
  };
}

describe('sourceDisplayName', () => {
  it('returns the plain name when no user has cards', () => {
    expect(sourceDisplayName(source([]), 1)).toEqual('Yhteinen tili');
    expect(sourceDisplayName(source([{ userId: 1, share: 1, cards: [] }]), 1)).toEqual(
      'Yhteinen tili',
    );
  });

  it('lists the own user cards first', () => {
    const s = source([
      { userId: 1, share: 1, cards: ['1226'] },
      { userId: 2, share: 1, cards: ['3515', '0011'] },
    ]);
    expect(sourceDisplayName(s, 2)).toEqual('Yhteinen tili (3515/0011/1226)');
    expect(sourceDisplayName(s, 1)).toEqual('Yhteinen tili (1226/3515/0011)');
  });

  it('preserves the stored card order within a user', () => {
    const s = source([{ userId: 1, share: 1, cards: ['5678', '1234'] }]);
    expect(sourceDisplayName(s, 1)).toEqual('Yhteinen tili (5678/1234)');
  });

  it('shows all cards when the own user is not attached to the source', () => {
    const s = source([{ userId: 1, share: 1, cards: ['1226'] }]);
    expect(sourceDisplayName(s, 3)).toEqual('Yhteinen tili (1226)');
  });
});
