import { z } from 'zod';

import { ISODate, ISOTimestamp } from '../time/Time';
import { DbObject, ShortString } from '../types/Common';
import { ObjectId } from '../types/Id';
import { StatementFormat } from '../types/Source';

export { StatementFormat };

/** Normalized money amount with a dot decimal separator, e.g. "-579.12". */
export const StatementAmount = z.string().regex(/^-?\d+\.\d{2}$/);
export type StatementAmount = z.infer<typeof StatementAmount>;

/**
 * One bank transaction, parsed from a statement CSV and normalized to a
 * format-independent shape. See docs/BANK_STATEMENTS.md.
 */
export const StatementRowData = z.object({
  bookingDate: ISODate,
  valueDate: ISODate,
  /** Signed amount in EUR; negative = money out of the account. */
  amount: StatementAmount,
  /** Bank's transaction type text, e.g. "PKORTTIMAKSU", "KORTTIOSTO". */
  type: ShortString,
  counterparty: z.string().nullable(),
  counterpartyAccount: z.string().nullable(),
  reference: z.string().nullable(),
  message: z.string().nullable(),
  archiveId: z.string().nullable(),
  /** The original CSV line, verbatim (debugging aid). */
  rawLine: z.string(),
});
export type StatementRowData = z.infer<typeof StatementRowData>;

export const StatementRow = StatementRowData.extend({
  id: ObjectId,
  sourceId: ObjectId,
  uploadId: ObjectId,
});
export type StatementRow = z.infer<typeof StatementRow>;

export const StatementUpload = DbObject.extend({
  sourceId: ObjectId,
  filename: ShortString,
  format: StatementFormat,
  uploadedBy: ObjectId,
  uploadedAt: ISOTimestamp,
  rowCount: z.number().int(),
  newCount: z.number().int(),
  duplicateCount: z.number().int(),
});
export type StatementUpload = z.infer<typeof StatementUpload>;

/** Upload request body: the raw CSV file content, as text. */
export const StatementUploadInput = z.object({
  filename: ShortString,
  content: z.string().min(1),
});
export type StatementUploadInput = z.infer<typeof StatementUploadInput>;

export const StatementUploadResult = z.object({
  uploadId: ObjectId,
  format: StatementFormat,
  rowCount: z.number().int(),
  newCount: z.number().int(),
  duplicateCount: z.number().int(),
});
export type StatementUploadResult = z.infer<typeof StatementUploadResult>;

/**
 * Upload batch as listed in the UI. currentRowCount is the live number of
 * rows the batch owns (first-seeing upload) — it can be lower than newCount
 * if rows have been deleted, and it is what a batch delete would remove.
 */
export const StatementUploadListItem = StatementUpload.extend({
  currentRowCount: z.number().int(),
});
export type StatementUploadListItem = z.infer<typeof StatementUploadListItem>;

export const StatementUploadDeleteResult = z.object({
  uploadId: ObjectId,
  deletedRowCount: z.number().int(),
});
export type StatementUploadDeleteResult = z.infer<typeof StatementUploadDeleteResult>;

/** One page of statement rows plus the total row count for the filter. */
export const StatementRowsResponse = z.object({
  rows: z.array(StatementRow),
  total: z.number().int(),
});
export type StatementRowsResponse = z.infer<typeof StatementRowsResponse>;
