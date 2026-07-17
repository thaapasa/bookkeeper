import { createHash } from 'crypto';

import {
  parseStatement,
  StatementRowData,
  StatementRowsResponse,
  StatementUploadDeleteResult,
  StatementUploadInput,
  StatementUploadListItem,
  StatementUploadResult,
} from 'shared/statement';
import { ISODate } from 'shared/time';
import { InvalidInputError, NotFoundError, ObjectId } from 'shared/types';
import { DbTask } from 'server/data/Db.ts';
import { getSourceById } from 'server/data/SourceDb';
import { logger } from 'server/Logger';
import { withSpan } from 'server/telemetry/Spans';

/**
 * Deduplication key for a statement row: a hash over all normalized fields.
 * The bank archive id alone is not unique (OP reuses it for recurring
 * standing-order payments), see docs/BANK_STATEMENTS.md.
 *
 * purchaseDate is intentionally NOT hashed: it is derived from the message
 * (which is hashed), and adding it would change every existing hash, turning
 * re-uploads into full duplicate imports.
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
              (group_id, source_id, upload_id, booking_date, value_date, purchase_date,
               amount, type, counterparty, counterparty_account, reference, message,
               archive_id, raw_line, row_hash)
            VALUES ($/groupId/, $/sourceId/, $/uploadId/, $/bookingDate/, $/valueDate/,
               $/purchaseDate/, $/amount/, $/type/, $/counterparty/, $/counterpartyAccount/,
               $/reference/, $/message/, $/archiveId/, $/rawLine/, $/rowHash/)
            ON CONFLICT (source_id, row_hash) DO NOTHING
            RETURNING id`,
          {
            groupId,
            sourceId,
            uploadId: upload.id,
            bookingDate: row.bookingDate,
            valueDate: row.valueDate,
            purchaseDate: row.purchaseDate,
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
  booking_date AS "bookingDate", value_date AS "valueDate",
  purchase_date AS "purchaseDate", amount, type,
  counterparty, counterparty_account AS "counterpartyAccount",
  reference, message, archive_id AS "archiveId", raw_line AS "rawLine", skipped,
  COUNT(*) OVER() AS total
FROM statement_row`;

export async function getStatementRows(
  tx: DbTask,
  groupId: ObjectId,
  sourceId: ObjectId,
  options: { startDate?: ISODate; endDate?: ISODate; limit: number; offset: number },
): Promise<StatementRowsResponse> {
  const rows = await tx.manyOrNone<StatementRowsResponse['rows'][number] & { total: number }>(
    `${rowSelect}
      WHERE group_id=$/groupId/ AND source_id=$/sourceId/
        AND ($/startDate/::DATE IS NULL OR booking_date >= $/startDate/)
        AND ($/endDate/::DATE IS NULL OR booking_date <= $/endDate/)
      ORDER BY booking_date DESC, id DESC
      LIMIT $/limit/ OFFSET $/offset/`,
    {
      groupId,
      sourceId,
      startDate: options.startDate ?? null,
      endDate: options.endDate ?? null,
      limit: options.limit,
      offset: options.offset,
    },
  );
  return {
    rows: rows.map(({ total, ...row }) => row),
    total: rows[0]?.total ?? 0,
  };
}

export async function getStatementUploads(
  tx: DbTask,
  groupId: ObjectId,
  sourceId: ObjectId,
): Promise<StatementUploadListItem[]> {
  return tx.manyOrNone<StatementUploadListItem>(
    `SELECT
        u.id, u.source_id AS "sourceId", u.filename, u.format,
        u.uploaded_by AS "uploadedBy", u.uploaded_at AS "uploadedAt",
        u.row_count AS "rowCount", u.new_count AS "newCount",
        u.duplicate_count AS "duplicateCount",
        COUNT(r.id) AS "currentRowCount"
      FROM statement_upload u
      LEFT JOIN statement_row r ON r.upload_id = u.id AND r.group_id = $/groupId/
      WHERE u.group_id=$/groupId/ AND u.source_id=$/sourceId/
      GROUP BY u.id
      ORDER BY u.uploaded_at DESC, u.id DESC`,
    { groupId, sourceId },
  );
}

/**
 * Deletes an upload batch and the statement rows it owns (the rows it was
 * the first to insert). Rows that were already present when the batch was
 * uploaded belong to an earlier batch and are not touched, so deleting a
 * mistaken upload is a clean undo of exactly what it added.
 */
export function deleteStatementUpload(
  tx: DbTask,
  groupId: ObjectId,
  uploadId: ObjectId,
): Promise<StatementUploadDeleteResult> {
  return withSpan(
    'statement.delete_upload',
    { 'app.group_id': groupId, 'app.upload_id': uploadId },
    async () => {
      const upload = await tx.oneOrNone<{ id: number }>(
        `SELECT id FROM statement_upload WHERE id=$/uploadId/ AND group_id=$/groupId/`,
        { uploadId, groupId },
      );
      if (!upload) {
        throw new NotFoundError('STATEMENT_UPLOAD_NOT_FOUND', 'statement upload', uploadId);
      }
      const deleted = await tx.manyOrNone<{ id: number }>(
        `DELETE FROM statement_row
          WHERE upload_id=$/uploadId/ AND group_id=$/groupId/
          RETURNING id`,
        { uploadId, groupId },
      );
      await tx.none(`DELETE FROM statement_upload WHERE id=$/uploadId/ AND group_id=$/groupId/`, {
        uploadId,
        groupId,
      });
      const result: StatementUploadDeleteResult = {
        uploadId,
        deletedRowCount: deleted.length,
      };
      logger.info({ groupId, ...result }, 'Deleted statement upload');
      return result;
    },
  );
}
