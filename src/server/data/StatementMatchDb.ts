import { DateTime } from 'luxon';

import {
  expenseBeneficiary,
  ExpenseDivisionItem,
  ExpenseInput,
  negateDivision,
  splitByShares,
} from 'shared/expense';
import {
  MatchableExpense,
  MatchingStatementRow,
  STATEMENT_MATCH_DATE_TOLERANCE_DAYS,
  StatementFixMatchInput,
  StatementMatchBulkInput,
  StatementMatchingData,
  StatementMatchInput,
  StatementRow,
} from 'shared/statement';
import { ISODate, ISOMonth, toISODate } from 'shared/time';
import { InvalidInputError, NotFoundError, ObjectId } from 'shared/types';
import { Money } from 'shared/util';
import { getExpenseById, getExpenseDivision, updateExpense } from 'server/data/BasicExpenseDb';
import { DbTask } from 'server/data/Db.ts';
import {
  statementRowEffectiveDate,
  statementRowFields,
  statementUploadJoin,
} from 'server/data/StatementDb';
import { logger } from 'server/Logger';
import { withSpan } from 'server/telemetry/Spans';

/**
 * Statement-to-expense matching (see docs/BANK_STATEMENTS.md). Many-to-many:
 * one payment can cover several expenses (split purchases), and one expense
 * can be paid with several bank payments. Duplicate links are prevented by
 * the (statement_row_id, expense_id) UNIQUE constraint.
 */

export function getStatementMatchingData(
  tx: DbTask,
  groupId: ObjectId,
  sourceId: ObjectId,
  month: ISOMonth,
): Promise<StatementMatchingData> {
  return withSpan(
    'statement.matching_data',
    { 'app.group_id': groupId, 'app.source_id': sourceId, 'app.month': month },
    () => doGetStatementMatchingData(tx, groupId, sourceId, month),
  );
}

async function doGetStatementMatchingData(
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
        e.split_id AS "splitId", e.subscription_id AS "subscriptionId", e.confirmed,
        e.statement_skip AS "statementSkip",
        COALESCE(
          ARRAY_AGG(m.statement_row_id) FILTER (WHERE m.statement_row_id IS NOT NULL),
          '{}'
        ) AS "matchedStatementRowIds"
      FROM expenses e
      LEFT JOIN statement_match m ON m.expense_id = e.id AND m.group_id = $/groupId/
      WHERE e.group_id = $/groupId/ AND e.source_id = $/sourceId/
        AND e.date >= $/start/ AND e.date < $/end/
      GROUP BY e.id
      ORDER BY e.date, e.id`,
    { groupId, sourceId, start, end },
  );

  const statementRows = await tx.manyOrNone<MatchingStatementRow>(
    `SELECT
        ${statementRowFields('r', 'u')},
        COALESCE(
          ARRAY_AGG(m.expense_id) FILTER (WHERE m.expense_id IS NOT NULL),
          '{}'
        ) AS "matchedExpenseIds"
      FROM statement_row r
      ${statementUploadJoin('r', 'u')}
      LEFT JOIN statement_match m ON m.statement_row_id = r.id AND m.group_id = $/groupId/
      WHERE r.group_id = $/groupId/ AND r.source_id = $/sourceId/
        AND ${statementRowEffectiveDate('r')} >= $/windowStart/
        AND ${statementRowEffectiveDate('r')} < $/windowEnd/
      GROUP BY r.id, u.format
      ORDER BY ${statementRowEffectiveDate('r')}, r.id`,
    { groupId, sourceId, windowStart, windowEnd },
  );

  return { expenses, statementRows };
}

/**
 * Links every listed statement row to every listed expense (pairwise cross
 * product). All rows and expenses must belong to the same group and source.
 * Existing links are left as-is, so a group can be extended incrementally.
 * Matching clears skip flags on both sides.
 *
 * With `confirmExpenses` (the suggestion-confirm flow, where the bank has
 * verified date and sum) any preliminary matched expense is also marked
 * confirmed. Manual matching must not pass it: a manually linked sum may
 * differ from the expense, so confirming there would freeze a wrong sum.
 */
export function createStatementMatch(
  tx: DbTask,
  groupId: ObjectId,
  input: StatementMatchInput,
  options?: { confirmExpenses?: boolean },
): Promise<void> {
  return withSpan(
    'statement.match',
    {
      'app.group_id': groupId,
      'app.statement_row_count': input.statementRowIds.length,
      'app.expense_count': input.expenseIds.length,
    },
    async () => {
      let sourceId: number | undefined;
      const requireSameSource = (itemSourceId: number, error: string) => {
        sourceId ??= itemSourceId;
        if (itemSourceId !== sourceId) {
          throw new InvalidInputError('STATEMENT_MATCH_SOURCE_MISMATCH', error);
        }
      };
      for (const statementRowId of input.statementRowIds) {
        const row = await tx.oneOrNone<{ id: number; sourceId: number }>(
          `SELECT id, source_id AS "sourceId" FROM statement_row
            WHERE id=$/statementRowId/ AND group_id=$/groupId/`,
          { statementRowId, groupId },
        );
        if (!row) {
          throw new NotFoundError('STATEMENT_ROW_NOT_FOUND', 'statement row', statementRowId);
        }
        requireSameSource(
          row.sourceId,
          `Statement row ${statementRowId} belongs to a different source`,
        );
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
        requireSameSource(
          expense.sourceId,
          `Expense ${expenseId} belongs to a different source than the statement rows`,
        );
      }
      for (const statementRowId of input.statementRowIds) {
        for (const expenseId of input.expenseIds) {
          await tx.none(
            `INSERT INTO statement_match (group_id, statement_row_id, expense_id)
              VALUES ($/groupId/, $/statementRowId/, $/expenseId/)
              ON CONFLICT (statement_row_id, expense_id) DO NOTHING`,
            { groupId, statementRowId, expenseId },
          );
        }
      }
      // A match supersedes any earlier "will not match" review decision
      await tx.none(
        `UPDATE statement_row SET skipped=FALSE
          WHERE id IN ($/statementRowIds:csv/) AND group_id=$/groupId/`,
        { statementRowIds: input.statementRowIds, groupId },
      );
      await tx.none(
        `UPDATE expenses SET statement_skip=FALSE
          WHERE id IN ($/expenseIds:csv/) AND group_id=$/groupId/`,
        { expenseIds: input.expenseIds, groupId },
      );
      if (options?.confirmExpenses) {
        // Only the expense row is touched; subscription defaults (the
        // recurring template) are never affected by confirming.
        await tx.none(
          `UPDATE expenses SET confirmed=TRUE
            WHERE id IN ($/expenseIds:csv/) AND group_id=$/groupId/ AND confirmed=FALSE`,
          { expenseIds: input.expenseIds, groupId },
        );
      }
      logger.info(
        { groupId, statementRowIds: input.statementRowIds, expenseIds: input.expenseIds },
        'Created statement match',
      );
    },
  );
}

/** Creates several match groups in one call, each validated independently. */
export function createStatementMatchesBulk(
  tx: DbTask,
  groupId: ObjectId,
  input: StatementMatchBulkInput,
): Promise<void> {
  return withSpan(
    'statement.match_bulk',
    { 'app.group_id': groupId, 'app.match_count': input.matches.length },
    async () => {
      for (const match of input.matches) {
        await createStatementMatch(tx, groupId, match, { confirmExpenses: true });
      }
    },
  );
}

/**
 * "Korjaa ja kohdista": fixes a preliminary expense to match the selected
 * statement rows and links it to them, in one transaction. The expense date
 * becomes the earliest effective statement date, the sum becomes the absolute
 * net of the row amounts, the division is re-split evenly among the current
 * beneficiaries (mirroring an editor sum edit with unchanged participants),
 * and the expense is confirmed. Runs through the single-expense update path,
 * so a subscription-generated expense's template defaults stay untouched.
 */
export function fixAndMatchExpense(
  tx: DbTask,
  groupId: ObjectId,
  userId: ObjectId,
  input: StatementFixMatchInput,
): Promise<void> {
  return withSpan(
    'statement.fix_match',
    {
      'app.group_id': groupId,
      'app.user_id': userId,
      'app.expense_id': input.expenseId,
      'app.statement_row_count': input.statementRowIds.length,
    },
    () => doFixAndMatchExpense(tx, groupId, userId, input),
  );
}

async function doFixAndMatchExpense(
  tx: DbTask,
  groupId: ObjectId,
  userId: ObjectId,
  input: StatementFixMatchInput,
): Promise<void> {
  const expense = await getExpenseById(tx, groupId, userId, input.expenseId);
  if (expense.type === 'transfer') {
    throw new InvalidInputError(
      'STATEMENT_FIX_INVALID_TYPE',
      'Only expenses and incomes can be fixed from statement rows',
    );
  }
  const rows = await tx.manyOrNone<{ id: number; sourceId: number; amount: string }>(
    `SELECT r.id, r.source_id AS "sourceId", r.amount
      FROM statement_row r
      WHERE r.id IN ($/statementRowIds:csv/) AND r.group_id=$/groupId/`,
    { statementRowIds: input.statementRowIds, groupId },
  );
  const missing = input.statementRowIds.find(id => !rows.some(r => r.id === id));
  if (missing !== undefined) {
    throw new NotFoundError('STATEMENT_ROW_NOT_FOUND', 'statement row', missing);
  }
  if (rows.some(r => r.sourceId !== expense.sourceId)) {
    throw new InvalidInputError(
      'STATEMENT_MATCH_SOURCE_MISMATCH',
      'Statement rows belong to a different source than the expense',
    );
  }
  // The fix derives date and sum from the selected rows alone, so neither
  // side may carry existing links that would fall outside the calculation.
  const existingMatch = await tx.oneOrNone(
    `SELECT 1 FROM statement_match
      WHERE (statement_row_id IN ($/statementRowIds:csv/) OR expense_id=$/expenseId/)
        AND group_id=$/groupId/
      LIMIT 1`,
    { statementRowIds: input.statementRowIds, expenseId: input.expenseId, groupId },
  );
  if (existingMatch) {
    throw new InvalidInputError(
      'STATEMENT_FIX_ALREADY_MATCHED',
      'Cannot fix from statement rows that are already matched',
    );
  }
  const date = await tx.one<{ date: ISODate }>(
    `SELECT MIN(${statementRowEffectiveDate('r')}) AS date
      FROM statement_row r
      WHERE r.id IN ($/statementRowIds:csv/) AND r.group_id=$/groupId/`,
    { statementRowIds: input.statementRowIds, groupId },
  );
  const sum = Money.sum(rows.map(r => r.amount)).abs();
  const division = await getExpenseDivision(tx, groupId, expense.id);
  const beneficiaryType = expenseBeneficiary[expense.type];
  const beneficiaries = [
    ...new Set(division.filter(d => d.type === beneficiaryType).map(d => d.userId)),
  ];
  if (beneficiaries.length < 1) {
    throw new InvalidInputError('STATEMENT_FIX_NO_DIVISION', 'Expense has no division to re-split');
  }
  // Even split of the new sum among the current beneficiaries; the payer side
  // is re-derived from source shares by determineDivision, exactly as when the
  // sum is edited in the expense dialog without changing the participants.
  const parts = splitByShares(
    sum,
    beneficiaries.map(u => ({ userId: u, share: 1 })),
  );
  const beneficiaryDivision: ExpenseDivisionItem[] = (
    beneficiaryType === 'split' ? negateDivision(parts) : parts
  ).map(p => ({ userId: p.userId, type: beneficiaryType, sum: p.sum.toString() }));
  const fixed: ExpenseInput = {
    userId: expense.userId,
    categoryId: expense.categoryId,
    sourceId: expense.sourceId,
    type: expense.type,
    title: expense.title,
    receiver: expense.receiver,
    description: expense.description,
    groupingId: expense.groupingId,
    currencyId: expense.currencyId,
    originalCurrencyValue: expense.originalCurrencyValue,
    date: date.date,
    sum: sum.toString(),
    division: beneficiaryDivision,
    confirmed: true,
  };
  await updateExpense(tx, userId, expense, fixed, expense.sourceId);
  await createStatementMatch(tx, groupId, {
    statementRowIds: input.statementRowIds,
    expenseIds: [expense.id],
  });
  logger.info(
    { groupId, expenseId: expense.id, statementRowIds: input.statementRowIds },
    'Fixed and matched expense from statement rows',
  );
}

/**
 * Copies every statement match of one expense to the listed expenses. Used
 * when splitting a matched expense: each part inherits all of the original's
 * statement rows, since the bank payment(s) explain the whole purchase. Must
 * run before the original expense row is deleted — the delete cascades to
 * `statement_match` and would wipe the links being copied.
 */
export function copyStatementMatches(
  tx: DbTask,
  groupId: ObjectId,
  fromExpenseId: ObjectId,
  toExpenseIds: ObjectId[],
): Promise<void> {
  return withSpan(
    'statement.copy_matches',
    {
      'app.group_id': groupId,
      'app.expense_id': fromExpenseId,
      'app.target_count': toExpenseIds.length,
    },
    async () => {
      await tx.none(
        `INSERT INTO statement_match (group_id, statement_row_id, expense_id)
          SELECT m.group_id, m.statement_row_id, t.id
            FROM statement_match m
            CROSS JOIN UNNEST($/toExpenseIds/::INTEGER[]) AS t(id)
            WHERE m.expense_id = $/fromExpenseId/ AND m.group_id = $/groupId/
          ON CONFLICT (statement_row_id, expense_id) DO NOTHING`,
        { groupId, fromExpenseId, toExpenseIds },
      );
    },
  );
}

/**
 * Copies the statement-skip flag of one expense to the listed expenses. Used
 * when splitting: if the original was marked "will never appear on a bank
 * statement", its parts will not either. The expense insert path does not
 * carry the flag, so without the copy every part would reset to false.
 */
export function copyStatementSkip(
  tx: DbTask,
  groupId: ObjectId,
  fromExpenseId: ObjectId,
  toExpenseIds: ObjectId[],
): Promise<void> {
  return withSpan(
    'statement.copy_skip',
    {
      'app.group_id': groupId,
      'app.expense_id': fromExpenseId,
      'app.target_count': toExpenseIds.length,
    },
    async () => {
      await tx.none(
        `UPDATE expenses SET statement_skip = (
            SELECT statement_skip FROM expenses
              WHERE id = $/fromExpenseId/ AND group_id = $/groupId/
          )
          WHERE id = ANY($/toExpenseIds/::INTEGER[]) AND group_id = $/groupId/`,
        { groupId, fromExpenseId, toExpenseIds },
      );
    },
  );
}

/** Statement rows matched to one expense, for the expense details view. */
export async function getStatementRowsForExpense(
  tx: DbTask,
  groupId: ObjectId,
  expenseId: ObjectId,
): Promise<StatementRow[]> {
  return tx.manyOrNone<StatementRow>(
    `SELECT ${statementRowFields('r', 'u')}
      FROM statement_row r
      ${statementUploadJoin('r', 'u')}
      JOIN statement_match m ON m.statement_row_id = r.id AND m.group_id = $/groupId/
      WHERE m.expense_id = $/expenseId/ AND r.group_id = $/groupId/
      ORDER BY ${statementRowEffectiveDate('r')}, r.id`,
    { groupId, expenseId },
  );
}

export function deleteMatchesForStatementRow(
  tx: DbTask,
  groupId: ObjectId,
  statementRowId: ObjectId,
): Promise<void> {
  return withSpan(
    'statement.unmatch_row',
    { 'app.group_id': groupId, 'app.statement_row_id': statementRowId },
    async () => {
      await tx.none(
        `DELETE FROM statement_match
          WHERE statement_row_id=$/statementRowId/ AND group_id=$/groupId/`,
        { statementRowId, groupId },
      );
    },
  );
}

export function deleteMatchForExpense(
  tx: DbTask,
  groupId: ObjectId,
  expenseId: ObjectId,
): Promise<void> {
  return withSpan(
    'statement.unmatch_expense',
    { 'app.group_id': groupId, 'app.expense_id': expenseId },
    async () => {
      await tx.none(
        `DELETE FROM statement_match WHERE expense_id=$/expenseId/ AND group_id=$/groupId/`,
        { expenseId, groupId },
      );
    },
  );
}

/** Marks a statement row as "will never match an expense". */
export function setStatementRowSkipped(
  tx: DbTask,
  groupId: ObjectId,
  statementRowId: ObjectId,
  skipped: boolean,
): Promise<void> {
  return withSpan(
    'statement.skip_row',
    { 'app.group_id': groupId, 'app.statement_row_id': statementRowId, 'app.skipped': skipped },
    () => doSetStatementRowSkipped(tx, groupId, statementRowId, skipped),
  );
}

async function doSetStatementRowSkipped(
  tx: DbTask,
  groupId: ObjectId,
  statementRowId: ObjectId,
  skipped: boolean,
): Promise<void> {
  if (skipped) {
    // LIMIT 1: matching is many-to-many, so several links may exist
    const match = await tx.oneOrNone(
      `SELECT 1 FROM statement_match
        WHERE statement_row_id=$/statementRowId/ AND group_id=$/groupId/
        LIMIT 1`,
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
export function setExpenseStatementSkip(
  tx: DbTask,
  groupId: ObjectId,
  expenseId: ObjectId,
  skipped: boolean,
): Promise<void> {
  return withSpan(
    'statement.skip_expense',
    { 'app.group_id': groupId, 'app.expense_id': expenseId, 'app.skipped': skipped },
    () => doSetExpenseStatementSkip(tx, groupId, expenseId, skipped),
  );
}

async function doSetExpenseStatementSkip(
  tx: DbTask,
  groupId: ObjectId,
  expenseId: ObjectId,
  skipped: boolean,
): Promise<void> {
  if (skipped) {
    // LIMIT 1: matching is many-to-many, so several links may exist
    const match = await tx.oneOrNone(
      `SELECT 1 FROM statement_match
        WHERE expense_id=$/expenseId/ AND group_id=$/groupId/
        LIMIT 1`,
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
