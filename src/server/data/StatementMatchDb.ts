import { DateTime } from 'luxon';

import {
  MatchableExpense,
  MatchingStatementRow,
  STATEMENT_MATCH_DATE_TOLERANCE_DAYS,
  StatementMatchingData,
  StatementMatchInput,
} from 'shared/statement';
import { ISOMonth, toISODate } from 'shared/time';
import { InvalidInputError, NotFoundError, ObjectId } from 'shared/types';
import { DbTask } from 'server/data/Db.ts';
import { logger } from 'server/Logger';
import { withSpan } from 'server/telemetry/Spans';

/**
 * Statement-to-expense matching (see docs/BANK_STATEMENTS.md). One statement
 * row can match several expenses (split purchases); an expense matches at
 * most one statement row (enforced by the UNIQUE constraint).
 */

export async function getStatementMatchingData(
  tx: DbTask,
  groupId: ObjectId,
  sourceId: ObjectId,
  month: ISOMonth,
): Promise<StatementMatchingData> {
  const monthStart = DateTime.fromISO(`${month}-01`);
  const start = toISODate(monthStart);
  const end = toISODate(monthStart.plus({ months: 1 }));
  const windowStart = toISODate(monthStart.minus({ days: STATEMENT_MATCH_DATE_TOLERANCE_DAYS }));
  const windowEnd = toISODate(
    monthStart.plus({ months: 1 }).plus({ days: STATEMENT_MATCH_DATE_TOLERANCE_DAYS }),
  );

  const expenses = await tx.manyOrNone<MatchableExpense>(
    `SELECT
        e.id, e.date, e.sum, e.type, e.title, e.receiver, e.user_id AS "userId",
        e.split_id AS "splitId", e.confirmed,
        e.statement_skip AS "statementSkip", m.statement_row_id AS "matchedStatementRowId"
      FROM expenses e
      LEFT JOIN statement_match m ON m.expense_id = e.id AND m.group_id = $/groupId/
      WHERE e.group_id = $/groupId/ AND e.source_id = $/sourceId/
        AND e.date >= $/start/ AND e.date < $/end/
      ORDER BY e.date, e.id`,
    { groupId, sourceId, start, end },
  );

  const statementRows = await tx.manyOrNone<MatchingStatementRow>(
    `SELECT
        r.id, r.source_id AS "sourceId", r.upload_id AS "uploadId",
        r.booking_date AS "bookingDate", r.value_date AS "valueDate",
        r.purchase_date AS "purchaseDate", r.amount, r.type,
        r.counterparty, r.counterparty_account AS "counterpartyAccount",
        r.reference, r.message, r.archive_id AS "archiveId", r.raw_line AS "rawLine",
        r.skipped,
        COALESCE(
          ARRAY_AGG(m.expense_id) FILTER (WHERE m.expense_id IS NOT NULL),
          '{}'
        ) AS "matchedExpenseIds"
      FROM statement_row r
      LEFT JOIN statement_match m ON m.statement_row_id = r.id AND m.group_id = $/groupId/
      WHERE r.group_id = $/groupId/ AND r.source_id = $/sourceId/
        AND COALESCE(r.purchase_date, r.value_date) >= $/windowStart/
        AND COALESCE(r.purchase_date, r.value_date) < $/windowEnd/
      GROUP BY r.id
      ORDER BY COALESCE(r.purchase_date, r.value_date), r.id`,
    { groupId, sourceId, windowStart, windowEnd },
  );

  return { expenses, statementRows };
}

/**
 * Matches one statement row to the given expenses. The expenses must belong
 * to the same group and source as the row and must not already be matched.
 * Matching clears skip flags on both sides.
 */
export function createStatementMatch(
  tx: DbTask,
  groupId: ObjectId,
  input: StatementMatchInput,
): Promise<void> {
  return withSpan(
    'statement.match',
    {
      'app.group_id': groupId,
      'app.statement_row_id': input.statementRowId,
      'app.expense_count': input.expenseIds.length,
    },
    async () => {
      const row = await tx.oneOrNone<{ id: number; sourceId: number }>(
        `SELECT id, source_id AS "sourceId" FROM statement_row
          WHERE id=$/statementRowId/ AND group_id=$/groupId/`,
        { statementRowId: input.statementRowId, groupId },
      );
      if (!row) {
        throw new NotFoundError('STATEMENT_ROW_NOT_FOUND', 'statement row', input.statementRowId);
      }
      for (const expenseId of input.expenseIds) {
        const expense = await tx.oneOrNone<{ id: number; sourceId: number }>(
          `SELECT id, source_id AS "sourceId" FROM expenses
            WHERE id=$/expenseId/ AND group_id=$/groupId/`,
          { expenseId, groupId },
        );
        if (!expense) {
          throw new NotFoundError('EXPENSE_NOT_FOUND', 'expense', expenseId);
        }
        if (expense.sourceId !== row.sourceId) {
          throw new InvalidInputError(
            'STATEMENT_MATCH_SOURCE_MISMATCH',
            `Expense ${expenseId} belongs to a different source than the statement row`,
          );
        }
        const inserted = await tx.oneOrNone<{ id: number }>(
          `INSERT INTO statement_match (group_id, statement_row_id, expense_id)
            VALUES ($/groupId/, $/statementRowId/, $/expenseId/)
            ON CONFLICT (expense_id) DO NOTHING
            RETURNING id`,
          { groupId, statementRowId: input.statementRowId, expenseId },
        );
        if (!inserted) {
          throw new InvalidInputError(
            'EXPENSE_ALREADY_MATCHED',
            `Expense ${expenseId} is already matched to a statement row`,
          );
        }
      }
      // A match supersedes any earlier "will not match" review decision
      await tx.none(
        `UPDATE statement_row SET skipped=FALSE
          WHERE id=$/statementRowId/ AND group_id=$/groupId/`,
        { statementRowId: input.statementRowId, groupId },
      );
      await tx.none(
        `UPDATE expenses SET statement_skip=FALSE
          WHERE id IN ($/expenseIds:csv/) AND group_id=$/groupId/`,
        { expenseIds: input.expenseIds, groupId },
      );
      logger.info(
        { groupId, statementRowId: input.statementRowId, expenseIds: input.expenseIds },
        'Created statement match',
      );
    },
  );
}

export async function deleteMatchesForStatementRow(
  tx: DbTask,
  groupId: ObjectId,
  statementRowId: ObjectId,
): Promise<void> {
  await tx.none(
    `DELETE FROM statement_match
      WHERE statement_row_id=$/statementRowId/ AND group_id=$/groupId/`,
    { statementRowId, groupId },
  );
}

export async function deleteMatchForExpense(
  tx: DbTask,
  groupId: ObjectId,
  expenseId: ObjectId,
): Promise<void> {
  await tx.none(
    `DELETE FROM statement_match WHERE expense_id=$/expenseId/ AND group_id=$/groupId/`,
    { expenseId, groupId },
  );
}

/** Marks a statement row as "will never match an expense". */
export async function setStatementRowSkipped(
  tx: DbTask,
  groupId: ObjectId,
  statementRowId: ObjectId,
  skipped: boolean,
): Promise<void> {
  if (skipped) {
    const match = await tx.oneOrNone(
      `SELECT id FROM statement_match
        WHERE statement_row_id=$/statementRowId/ AND group_id=$/groupId/`,
      { statementRowId, groupId },
    );
    if (match) {
      throw new InvalidInputError(
        'STATEMENT_ROW_MATCHED',
        'Cannot skip a statement row that is matched to expenses',
      );
    }
  }
  const updated = await tx.oneOrNone(
    `UPDATE statement_row SET skipped=$/skipped/
      WHERE id=$/statementRowId/ AND group_id=$/groupId/
      RETURNING id`,
    { statementRowId, groupId, skipped },
  );
  if (!updated) {
    throw new NotFoundError('STATEMENT_ROW_NOT_FOUND', 'statement row', statementRowId);
  }
}

/** Marks an expense as "will never appear on a bank statement". */
export async function setExpenseStatementSkip(
  tx: DbTask,
  groupId: ObjectId,
  expenseId: ObjectId,
  skipped: boolean,
): Promise<void> {
  if (skipped) {
    const match = await tx.oneOrNone(
      `SELECT id FROM statement_match WHERE expense_id=$/expenseId/ AND group_id=$/groupId/`,
      { expenseId, groupId },
    );
    if (match) {
      throw new InvalidInputError(
        'EXPENSE_MATCHED',
        'Cannot skip an expense that is matched to a statement row',
      );
    }
  }
  const updated = await tx.oneOrNone(
    `UPDATE expenses SET statement_skip=$/skipped/
      WHERE id=$/expenseId/ AND group_id=$/groupId/
      RETURNING id`,
    { expenseId, groupId, skipped },
  );
  if (!updated) {
    throw new NotFoundError('EXPENSE_NOT_FOUND', 'expense', expenseId);
  }
}
