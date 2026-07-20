import { describe, expect, it } from 'bun:test';

import { Source, UserShare } from '../types/Source';
import { extractCardLastDigits, findCardUserId } from './StatementCard';

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

describe('extractCardLastDigits', () => {
  it('extracts the last 4 digits from an OP card message', () => {
    expect(extractCardLastDigits('401046******1226 OSTOPVM 260101MF NRO 742')).toEqual('1226');
  });

  it('extracts the last 4 digits from an S-pankki card message', () => {
    expect(extractCardLastDigits('431871******3515 260511000001')).toEqual('3515');
  });

  it('extracts from a message with nothing after the mask', () => {
    expect(extractCardLastDigits('512345******9876')).toEqual('9876');
  });

  it('returns null for messages without a card mask', () => {
    expect(extractCardLastDigits('Vuokra toukokuu')).toBeNull();
    expect(extractCardLastDigits('')).toBeNull();
    expect(extractCardLastDigits(null)).toBeNull();
  });

  it('returns null when the mask is not at the start of the message', () => {
    expect(extractCardLastDigits('Maksu 401046******1226')).toBeNull();
  });
});

describe('findCardUserId', () => {
  const jenni: UserShare = { userId: 1, share: 1, cards: ['1226', '0011'] };
  const sale: UserShare = { userId: 2, share: 1, cards: ['3515'] };

  it('resolves the user whose card paid the row', () => {
    expect(findCardUserId(source([jenni, sale]), '401046******1226 OSTOPVM 260101')).toEqual(1);
    expect(findCardUserId(source([jenni, sale]), '431871******3515 260511000001')).toEqual(2);
  });

  it('returns undefined when no user has the card', () => {
    expect(findCardUserId(source([jenni, sale]), '401046******9999')).toBeUndefined();
  });

  it('returns undefined when no cards are configured', () => {
    const noCards = source([
      { userId: 1, share: 1, cards: [] },
      { userId: 2, share: 1, cards: [] },
    ]);
    expect(findCardUserId(noCards, '401046******1226')).toBeUndefined();
  });

  it('returns undefined for an ambiguous match', () => {
    const shared = source([
      { userId: 1, share: 1, cards: ['1226'] },
      { userId: 2, share: 1, cards: ['1226'] },
    ]);
    expect(findCardUserId(shared, '401046******1226')).toBeUndefined();
  });

  it('returns undefined without a source or message', () => {
    expect(findCardUserId(undefined, '401046******1226')).toBeUndefined();
    expect(findCardUserId(source([jenni]), null)).toBeUndefined();
  });
});
