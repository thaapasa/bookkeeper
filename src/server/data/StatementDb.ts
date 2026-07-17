import { createHash } from 'crypto';

import {
  parseStatement,
  StatementRow,
  StatementRowData,
  StatementUploadInput,
  StatementUploadResult,
} from 'shared/statement';
import { ISODate } from 'shared/time';
import { InvalidInputError, ObjectId } from 'shared/types';
import { DbTask } from 'server/data/Db.ts';
import { getSourceById } from 'server/data/SourceDb';
import { logger } from 'server/Logger';
import { withSpan } from 'server/telemetry/Spans';

/**
 * Deduplication key for a statement row: a hash over all normalized fields.
 * The bank archive id alone is not unique (OP reuses it for recurring
 * standing-order payments), see docs/BANK_STATEMENTS.md.
 */
function calculateRowHash(row: StatementRowData): string {
  return createHash('sha256')
    .update(
      [
        row.bookingDate,
        row.valueDate,
        row.amount,
        row.type,
        row.counterparty ?? '',
        row.counterpartyAccount ?? '',
        row.reference ?? '',
        row.message ?? '',
        row.archiveId ?? '',
      ].join('\n'),
    )
    .digest('hex');
}

/**
 * Parses an uploaded statement CSV and imports its rows for the given
 * source. Rows already present (by row hash) are skipped, so overlapping
 * exports and re-uploads are safe.
 */
export function importStatement(
  tx: DbTask,
  groupId: ObjectId,
  sourceId: ObjectId,
  userId: ObjectId,
  input: StatementUploadInput,
): Promise<StatementUploadResult> {
  return withSpan(
    'statement.import',
    { 'app.group_id': groupId, 'app.source_id': sourceId, 'app.user_id': userId },
    async () => {
      const source = await getSourceById(tx, groupId, sourceId);
      if (!source.statementFormat) {
        throw new InvalidInputError(
          'SOURCE_HAS_NO_STATEMENT_FORMAT',
          `Source ${sourceId} has no statement format configured`,
        );
      }
      const parsed = parseStatement(input.content);
      if (parsed.format !== source.statementFormat) {
        throw new InvalidInputError(
          'STATEMENT_FORMAT_MISMATCH',
          `Statement format ${parsed.format} does not match source format ${source.statementFormat}`,
        );
      }

      const upload = await tx.one<{ id: number }>(
        `INSERT INTO statement_upload
            (group_id, source_id, filename, format, uploaded_by, row_count, new_count, duplicate_count)
          VALUES ($/groupId/, $/sourceId/, $/filename/, $/format/, $/userId/, 0, 0, 0)
          RETURNING id`,
        { groupId, sourceId, filename: input.filename, format: parsed.format, userId },
      );

      let newCount = 0;
      for (const row of parsed.rows) {
        const inserted = await tx.oneOrNone<{ id: number }>(
          `INSERT INTO statement_row
              (group_id, source_id, upload_id, booking_date, value_date, amount, type,
               counterparty, counterparty_account, reference, message, archive_id,
               raw_line, row_hash)
            VALUES ($/groupId/, $/sourceId/, $/uploadId/, $/bookingDate/, $/valueDate/,
               $/amount/, $/type/, $/counterparty/, $/counterpartyAccount/, $/reference/,
               $/message/, $/archiveId/, $/rawLine/, $/rowHash/)
            ON CONFLICT (source_id, row_hash) DO NOTHING
            RETURNING id`,
          {
            groupId,
            sourceId,
            uploadId: upload.id,
            bookingDate: row.bookingDate,
            valueDate: row.valueDate,
            amount: row.amount,
            type: row.type,
            counterparty: row.counterparty,
            counterpartyAccount: row.counterpartyAccount,
            reference: row.reference,
            message: row.message,
            archiveId: row.archiveId,
            rawLine: row.rawLine,
            rowHash: calculateRowHash(row),
          },
        );
        if (inserted) {
          newCount++;
        }
      }

      const result: StatementUploadResult = {
        uploadId: upload.id,
        format: parsed.format,
        rowCount: parsed.rows.length,
        newCount,
        duplicateCount: parsed.rows.length - newCount,
      };
      await tx.none(
        `UPDATE statement_upload
            SET row_count=$/rowCount/, new_count=$/newCount/, duplicate_count=$/duplicateCount/
            WHERE id=$/uploadId/ AND group_id=$/groupId/`,
        { ...result, groupId },
      );
      logger.info({ groupId, sourceId, ...result }, 'Imported statement');
      return result;
    },
  );
}

const rowSelect = `--sql
SELECT
  id, source_id AS "sourceId", upload_id AS "uploadId",
  booking_date AS "bookingDate", value_date AS "valueDate", amount, type,
  counterparty, counterparty_account AS "counterpartyAccount",
  reference, message, archive_id AS "archiveId", raw_line AS "rawLine"
FROM statement_row`;

export async function getStatementRows(
  tx: DbTask,
  groupId: ObjectId,
  sourceId: ObjectId,
  startDate?: ISODate,
  endDate?: ISODate,
): Promise<StatementRow[]> {
  return tx.manyOrNone<StatementRow>(
    `${rowSelect}
      WHERE group_id=$/groupId/ AND source_id=$/sourceId/
        AND ($/startDate/::DATE IS NULL OR booking_date >= $/startDate/)
        AND ($/endDate/::DATE IS NULL OR booking_date <= $/endDate/)
      ORDER BY booking_date DESC, id DESC`,
    { groupId, sourceId, startDate: startDate ?? null, endDate: endDate ?? null },
  );
}
