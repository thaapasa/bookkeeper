import { sourceDisplayName } from 'shared/source';
import { StatementFormat } from 'shared/statement';
import { ObjectId, Session, Source } from 'shared/types';

/** Display names for the supported statement formats. */
export const statementFormatLabels: Record<StatementFormat, string> = {
  op: 'OP',
  spankki: 'S-pankki',
};

export interface SourceOption {
  id: ObjectId;
  name: string;
}

/**
 * Sources that can receive statements of the given format, with the
 * current user's own sources (mapped in source_users) listed first.
 */
export function statementSourceOptions(session: Session, format: StatementFormat): SourceOption[] {
  const isOwn = (s: Source) => s.users.some(u => u.userId === session.user.id);
  return session.sources
    .filter(s => s.statementFormat === format)
    .sort((a, b) => Number(isOwn(b)) - Number(isOwn(a)))
    .map(s => toOption(s, session.user.id));
}

/**
 * Auto-selects the upload target: when exactly one format-matching source is
 * mapped to the current user in its user shares, that source is the obvious
 * target (the common case: each user has one OP source and one S-pankki
 * source of their own).
 */
export function autoSelectStatementSource(
  session: Session,
  format: StatementFormat,
): ObjectId | undefined {
  const own = session.sources.filter(
    s => s.statementFormat === format && s.users.some(u => u.userId === session.user.id),
  );
  return own.length === 1 ? own[0].id : undefined;
}

const toOption = (s: Source, ownUserId: ObjectId): SourceOption => ({
  id: s.id,
  name: sourceDisplayName(s, ownUserId),
});
