import { ObjectId } from '../types/Id';
import { Source } from '../types/Source';

/**
 * Formats a source name with the last digits of its attached cards, e.g.
 * "Yhteinen tili (1226/3515/0011)". The session user's own cards come
 * first (in stored order), then other users' cards in source user order.
 * Returns the plain name when the source has no cards.
 */
export function sourceDisplayName(source: Source, ownUserId: ObjectId): string {
  const own = source.users.filter(u => u.userId === ownUserId);
  const others = source.users.filter(u => u.userId !== ownUserId);
  const cards = [...own, ...others].flatMap(u => u.cards);
  return cards.length > 0 ? `${source.name} (${cards.join('/')})` : source.name;
}
