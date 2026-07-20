import { sourceDisplayName } from 'shared/source';
import { sourceFormatForFile, StatementFileFormat } from 'shared/statement';
import { ObjectId, Session, Source } from 'shared/types';

/** Display names for the supported statement file formats. */
export const statementFormatLabels: Record<StatementFileFormat, string> = {
  op: 'OP',
  spankki: 'S-pankki',
  'op-credit': 'OP-luotto',
};

export interface SourceOption {
  id: ObjectId;
  name: string;
}

/**
 * Sources that can receive statement files of the given format (e.g.
 * 'op-credit' files go into 'op' sources), with the current user's own
 * sources (mapped in source_users) listed first.
 */
export function statementSourceOptions(
  session: Session,
  format: StatementFileFormat,
): SourceOption[] {
  const isOwn = (s: Source) => s.users.some(u => u.userId === session.user.id);
  return session.sources
    .filter(s => s.statementFormat === sourceFormatForFile(format))
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
  format: StatementFileFormat,
): ObjectId | undefined {
  const own = session.sources.filter(
    s =>
      s.statementFormat === sourceFormatForFile(format) &&
      s.users.some(u => u.userId === session.user.id),
  );
  return own.length === 1 ? own[0].id : undefined;
}

const toOption = (s: Source, ownUserId: ObjectId): SourceOption => ({
  id: s.id,
  name: sourceDisplayName(s, ownUserId),
});
