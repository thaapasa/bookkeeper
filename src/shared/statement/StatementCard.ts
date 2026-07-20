import { ObjectId } from '../types/Id';
import { Source } from '../types/Source';

/**
 * Card payment messages start with the masked card number, e.g.
 * "401046******1226 OSTOPVM 260101..." (OP) or "431871******3515..."
 * (S-pankki). The last 4 digits identify the card.
 */
const CardMaskRE = /^\d{6}\*{6}(\d{4})/;

/** Extracts the last 4 digits of the card from a statement row message, if present. */
export function extractCardLastDigits(message: string | null): string | null {
  const match = message ? CardMaskRE.exec(message) : null;
  return match ? match[1] : null;
}

/**
 * Resolves which user's card paid a statement row, by matching the masked
 * card number at the start of the message against the cards attached to the
 * row's source. Returns undefined when the message has no card, no user has
 * the card, or the match is ambiguous (two users share the same last 4).
 */
export function findCardUserId(
  source: Source | undefined,
  message: string | null,
): ObjectId | undefined {
  const last4 = extractCardLastDigits(message);
  if (!last4 || !source) {
    return undefined;
  }
  const owners = source.users.filter(u => u.cards.includes(last4));
  return owners.length === 1 ? owners[0].userId : undefined;
}
