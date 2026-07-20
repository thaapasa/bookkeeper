import { randomUUID } from 'crypto';

import { Expense, ExpenseSplit } from 'shared/expense';
import { ApiMessage, BkError } from 'shared/types';
import { Money } from 'shared/util';
import { DbTask } from 'server/data/Db.ts';
import { logger } from 'server/Logger';
import { withSpan } from 'server/telemetry/Spans';

import { deleteExpenseById, getExpenseById } from './BasicExpenseDb';
import { createExpense } from './BasicExpenseService';
import { toBaseExpense } from './ExpenseUtils';
import { copyStatementMatches, copyStatementSkip } from './StatementMatchDb';

export function splitExpense(
  tx: DbTask,
  groupId: number,
  userId: number,
  expenseId: number,
  splits: ExpenseSplit[],
) {
  return withSpan(
    'expense.split',
    {
      'app.user_id': userId,
      'app.group_id': groupId,
      'app.expense_id': expenseId,
      'app.split_count': splits.length,
    },
    async () => {
      const expense = toBaseExpense(await getExpenseById(tx, groupId, userId, expenseId));
      if (expense.subscriptionId) {
        throw new BkError('INVALID_SPLIT', 'Subscription-generated expenses cannot be split', 400);
      }
      await checkSplits(splits, expense);
      // Re-splitting a part keeps it in its original split group so all
      // descendants of one original expense share the same key.
      const splitId = expense.splitId ?? randomUUID();
      logger.debug({ expense, splits, splitId }, 'Splitting expense');
      const partIds: number[] = [];
      for (const [i, s] of splits.entries()) {
        partIds.push(await createSplit(tx, expense, s, splitId, i === 0));
      }
      // Every part inherits the original's statement matches and skip flag;
      // without the copy the delete below would cascade the matches away, and
      // the insert path resets statement_skip to false.
      await copyStatementMatches(tx, groupId, expenseId, partIds);
      await copyStatementSkip(tx, groupId, expenseId, partIds);
      await deleteExpenseById(tx, groupId, expenseId);
      return {
        status: 'OK',
        message: `Splitted expense ${expenseId} into ${splits.length} parts`,
      };
    },
  );
}

/**
 * Manually marks two expenses as parts of the same split group. Reuses an
 * existing split id from either side if present; when both sides already
 * belong to different groups, the groups are merged by rewriting every
 * expense carrying either key to the surviving key.
 */
export function linkSplitExpenses(
  tx: DbTask,
  groupId: number,
  userId: number,
  expenseId: number,
  targetExpenseId: number,
): Promise<ApiMessage> {
  return withSpan(
    'expense.link_split',
    {
      'app.user_id': userId,
      'app.group_id': groupId,
      'app.expense_id': expenseId,
      'app.target_expense_id': targetExpenseId,
    },
    async () => {
      if (expenseId === targetExpenseId) {
        throw new BkError('INVALID_SPLIT_LINK', 'Cannot link an expense to itself', 400);
      }
      // Group-scoped lookups: both ids must resolve inside the session group.
      const expense = await getExpenseById(tx, groupId, userId, expenseId);
      const target = await getExpenseById(tx, groupId, userId, targetExpenseId);
      if (expense.subscriptionId || target.subscriptionId) {
        throw new BkError(
          'INVALID_SPLIT_LINK',
          'Subscription-generated expenses cannot be linked as splits',
          400,
        );
      }
      const splitId = expense.splitId ?? target.splitId ?? randomUUID();
      const mergedSplitIds = [expense.splitId, target.splitId].filter(
        (s): s is string => s !== null && s !== splitId,
      );
      logger.debug({ expenseId, targetExpenseId, splitId, mergedSplitIds }, 'Linking split');
      await tx.none(
        `UPDATE expenses
          SET split_id = $/splitId/::UUID
          WHERE group_id = $/groupId/
            AND (id = ANY($/ids/::INTEGER[]) OR split_id = ANY($/mergedSplitIds/::UUID[]))`,
        { splitId, groupId, ids: [expenseId, targetExpenseId], mergedSplitIds },
      );
      return { status: 'OK', message: `Linked expenses ${expenseId} and ${targetExpenseId}` };
    },
  );
}

/**
 * Removes an expense from its split group. If only one other expense would
 * remain in the group, its key is cleared too — a group of one carries no
 * information.
 */
export function unlinkSplitExpense(
  tx: DbTask,
  groupId: number,
  userId: number,
  expenseId: number,
): Promise<ApiMessage> {
  return withSpan(
    'expense.unlink_split',
    { 'app.user_id': userId, 'app.group_id': groupId, 'app.expense_id': expenseId },
    async () => {
      const expense = await getExpenseById(tx, groupId, userId, expenseId);
      const splitId = expense.splitId;
      if (!splitId) {
        return { status: 'OK', message: `Expense ${expenseId} is not linked` };
      }
      await tx.none(
        `UPDATE expenses
          SET split_id = NULL
          WHERE id = $/expenseId/ AND group_id = $/groupId/`,
        { expenseId, groupId },
      );
      await tx.none(
        `UPDATE expenses
          SET split_id = NULL
          WHERE group_id = $/groupId/ AND split_id = $/splitId/::UUID
            AND (SELECT COUNT(*) FROM expenses
                  WHERE group_id = $/groupId/ AND split_id = $/splitId/::UUID) < 2`,
        { groupId, splitId },
      );
      return { status: 'OK', message: `Unlinked expense ${expenseId}` };
    },
  );
}

/** Creates one split part; returns the new expense id. */
async function createSplit(
  tx: DbTask,
  expense: Expense,
  split: ExpenseSplit,
  splitId: string,
  first: boolean,
): Promise<number> {
  // The foreign currency annotation stays on the first part only, as a reference to what
  // the original expense cost abroad (the parent row is deleted, so this is the only place
  // it can survive). The other parts must not inherit it: each would claim the parent's
  // *entire* original amount, so splitting a $100 expense in two would yield two parts
  // each claiming to have cost $100.
  // subscriptionId is nulled explicitly: splitExpense already rejects subscription-generated
  // parents, but the spread would silently revive the inheritance (parts rendering inside the
  // collapsed recurring section) if that guard were ever relaxed — and the leak is
  // type-invisible since the insert reads it from the runtime spread.
  const splitted = {
    ...expense,
    ...split,
    subscriptionId: null,
    currencyId: first ? expense.currencyId : null,
    originalCurrencyValue: first ? expense.originalCurrencyValue : null,
  };
  logger.debug(splitted, `Creating new expense`);
  const created = await createExpense(
    tx,
    expense.userId,
    expense.groupId,
    splitted,
    expense.sourceId,
    splitId,
  );
  return created.expenseId;
}

async function checkSplits(splits: ExpenseSplit[], expense: Expense) {
  if (splits.length < 2) {
    throw new BkError(
      'INVALID_SPLIT',
      'Expense splitting requires at least two splits',
      400,
      splits,
    );
  }

  const partSum = Money.sum(splits.map(s => s.sum));
  if (!partSum.equals(expense.sum)) {
    throw new BkError(
      'INVALID_SPLIT',
      `Split sums (${partSum.toString()}) do not match expense sum (${expense.sum})`,
      400,
      splits,
    );
  }
}
