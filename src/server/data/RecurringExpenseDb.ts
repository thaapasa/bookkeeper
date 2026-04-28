import { DateTime } from 'luxon';

import {
  Expense,
  ExpenseDefaults,
  ExpenseDivisionItem,
  ExpenseInput,
  ExpenseQuery,
  Recurrence,
  RecurrencePeriod,
  RecurrenceUnit,
  RecurringExpenseInput,
  RecurringExpenseTarget,
  SubscriptionDeleteMode,
  SubscriptionUpdate,
} from 'shared/expense';
import { DateLike, ISODate, toDateTime, toISODate } from 'shared/time';
import {
  ApiMessage,
  BkError,
  InvalidExpense,
  InvalidInputError,
  NotFoundError,
  ObjectId,
  RecurringExpenseCreatedResponse,
  Source,
} from 'shared/types';
import { camelCaseObject, Money } from 'shared/util';
import { DbTask } from 'server/data/Db.ts';
import { logger } from 'server/Logger';
import { withSpan } from 'server/telemetry/Spans';

import {
  createNewExpense,
  deleteExpenseById,
  ExpenseInsert,
  getExpenseById,
  setExpenseDataDefaults,
  storeExpenseDivision,
  updateExpense,
} from './BasicExpenseDb';
import { getCategoryById } from './CategoryDb';
import { determineDivision } from './ExpenseDivision';
import { calculateNextRecurrence } from './RecurringExpenseService';
import { getSourceById } from './SourceDb';
import { getUserById } from './UserDb';

export function filterFromExpense(expense: Expense): ExpenseQuery {
  const filter: ExpenseQuery = { categoryId: expense.categoryId };
  if (expense.receiver) filter.receiver = expense.receiver;
  return filter;
}

export function defaultsFromExpense(expense: Expense): ExpenseDefaults {
  return {
    title: expense.title,
    ...(expense.receiver ? { receiver: expense.receiver } : {}),
    sum: Money.toString(expense.sum),
    type: expense.type,
    sourceId: expense.sourceId,
    categoryId: expense.categoryId,
    userId: expense.userId,
    confirmed: expense.confirmed,
    description: expense.description ?? null,
  };
}

/**
 * One subscription row, post-6b: recurring rows carry `period` and
 * `defaults`, report-style rows leave both undefined. `userId` is the
 * row's owner (recurring: backfilled from the original template's
 * userId; report: the user who saved the report).
 */
export interface SubscriptionRow {
  id: ObjectId;
  groupId: ObjectId;
  userId: ObjectId | null;
  title: string;
  filter: ExpenseQuery;
  period?: RecurrencePeriod;
  defaults?: ExpenseDefaults;
  nextMissing?: ISODate;
  occursUntil?: ISODate;
  /**
   * The category this row is filed under in UI groupings. Pulled from
   * the filter's `categoryId`. If the filter has none, the row floats
   * up to the page's "uncategorized" bucket — surfaced as 0 in the
   * unified card layout, with a link in the matched-rows expander to
   * the broader expense list.
   */
  categoryId: ObjectId | null;
}

interface SubscriptionRowDb {
  id: ObjectId;
  groupId: ObjectId;
  userId: ObjectId | null;
  title: string;
  filter: ExpenseQuery;
  defaults: ExpenseDefaults | null;
  periodUnit: RecurrenceUnit | null;
  periodAmount: number | null;
  nextMissing: ISODate | null;
  occursUntil: ISODate | null;
}

const SubscriptionRowSelect = `
  SELECT
    id AS "id",
    group_id AS "groupId",
    user_id AS "userId",
    title,
    filter AS "filter",
    defaults AS "defaults",
    period_unit AS "periodUnit",
    period_amount AS "periodAmount",
    next_missing AS "nextMissing",
    occurs_until AS "occursUntil"
    FROM subscriptions
`;

function dbRowToSubscriptionRow(row: SubscriptionRowDb): SubscriptionRow {
  const period =
    row.periodUnit && row.periodAmount
      ? { unit: row.periodUnit, amount: row.periodAmount }
      : undefined;
  return {
    id: row.id,
    groupId: row.groupId,
    userId: row.userId,
    title: row.title,
    filter: row.filter,
    defaults: row.defaults ?? undefined,
    period,
    nextMissing: row.nextMissing ?? undefined,
    occursUntil: row.occursUntil ?? undefined,
    categoryId: primaryCategoryId(row.filter),
  };
}

function primaryCategoryId(filter: ExpenseQuery): ObjectId | null {
  if (filter.categoryId === undefined) return null;
  return Array.isArray(filter.categoryId) ? (filter.categoryId[0] ?? null) : filter.categoryId;
}

export async function getSubscriptionRows(
  tx: DbTask,
  groupId: ObjectId,
): Promise<SubscriptionRow[]> {
  const rows = await tx.manyOrNone<SubscriptionRowDb>(
    `${SubscriptionRowSelect} WHERE group_id = $/groupId/ ORDER BY id`,
    { groupId },
  );
  return rows.map(dbRowToSubscriptionRow);
}

export async function getSubscriptionRow(
  tx: DbTask,
  groupId: ObjectId,
  subscriptionId: ObjectId,
): Promise<SubscriptionRow> {
  const row = await tx.oneOrNone<SubscriptionRowDb>(
    `${SubscriptionRowSelect} WHERE group_id = $/groupId/ AND id = $/subscriptionId/`,
    { groupId, subscriptionId },
  );
  if (!row) {
    throw new NotFoundError('SUBSCRIPTION_NOT_FOUND', `Subscription`, subscriptionId);
  }
  return dbRowToSubscriptionRow(row);
}

export function createRecurringFromExpense(
  tx: DbTask,
  groupId: ObjectId,
  userId: ObjectId,
  expenseId: ObjectId,
  recurrence: RecurringExpenseInput,
): Promise<RecurringExpenseCreatedResponse> {
  return withSpan(
    'recurring.create',
    {
      'app.group_id': groupId,
      'app.user_id': userId,
      'app.expense_id': expenseId,
      'app.period_unit': recurrence.period.unit,
      'app.period_amount': recurrence.period.amount,
    },
    async () => {
      logger.info(
        `Create recurring expense with a period of ${recurrence.period.amount} ${recurrence.period.unit} from ${expenseId}`,
      );
      const expense = await getExpenseById(tx, groupId, userId, expenseId);
      if (expense.subscriptionId && expense.subscriptionId > 0) {
        throw new InvalidInputError(
          'INVALID_INPUT',
          `Expense ${expenseId} is already a recurring expense (${expense.subscriptionId})`,
        );
      }
      const nextMissing = calculateNextRecurrence(expense.date, recurrence.period);
      const filter = filterFromExpense(expense);
      const defaults = defaultsFromExpense(expense);
      const subscriptionId = (
        await tx.one<{ id: number }>(
          `INSERT INTO subscriptions
              (period_amount, period_unit, next_missing, group_id, user_id, title, filter, defaults)
            VALUES (
              $/periodAmount/, $/periodUnit/, $/nextMissing/::DATE,
              $/groupId/, $/ownerId/, $/title/,
              $/filter/::JSONB, $/defaults/::JSONB)
            RETURNING id`,
          {
            periodAmount: recurrence.period.amount,
            periodUnit: recurrence.period.unit,
            nextMissing: toISODate(nextMissing),
            groupId,
            ownerId: expense.userId,
            title: expense.title,
            filter,
            defaults,
          },
        )
      ).id;

      await tx.none(
        `UPDATE expenses
            SET subscription_id = $/subscriptionId/
            WHERE id = $/expenseId/ AND group_id = $/groupId/`,
        { subscriptionId, expenseId, groupId },
      );
      return {
        status: 'OK',
        message: 'Recurrence created',
        expenseId,
        subscriptionId,
      };
    },
  );
}

function getDatesUpTo(recurrence: Recurrence, date: DateTime): ISODate[] {
  let generating = toDateTime(recurrence.nextMissing);
  const dates: ISODate[] = [];
  while (generating < date) {
    dates.push(toISODate(generating));
    generating = calculateNextRecurrence(generating, recurrence.period);
  }
  return dates;
}

async function generateRowFromDefaults(
  tx: DbTask,
  groupId: ObjectId,
  subscriptionId: ObjectId,
  defaults: ExpenseDefaults,
  source: Source,
  date: ISODate,
): Promise<number> {
  const insert: ExpenseInsert = {
    userId: defaults.userId,
    groupId,
    sourceId: defaults.sourceId,
    categoryId: defaults.categoryId,
    type: defaults.type,
    title: defaults.title,
    receiver: defaults.receiver ?? '',
    sum: defaults.sum,
    confirmed: defaults.confirmed,
    description: defaults.description,
    date,
    subscriptionId,
  };
  // Division is always derived from the current source split; the
  // subscription's stored defaults intentionally don't carry a
  // pre-computed division, so a stale or hand-crafted PATCH can't slip
  // an invariant-breaking expense_division blob through this path.
  const division = determineDivision(insert, source);
  logger.debug('Generating subscription row %s at %s', defaults.title, date);
  return createNewExpense(tx, defaults.userId, insert, division);
}

async function createMissingRecurrences(
  tx: DbTask,
  groupId: ObjectId,
  date: DateTime,
  recurrenceDb: RecurrenceInDb,
) {
  const recurrence: Recurrence & { defaults: ExpenseDefaults } = {
    id: recurrenceDb.id,
    nextMissing: recurrenceDb.nextMissing,
    occursUntil: recurrenceDb.occursUntil,
    period: { amount: recurrenceDb.periodAmount, unit: recurrenceDb.periodUnit },
    defaults: recurrenceDb.defaults,
  };
  const until = recurrence.occursUntil ? toDateTime(recurrence.occursUntil) : null;
  const maxDate = until && until < date ? until : toDateTime(date);
  const dates = getDatesUpTo(recurrence, maxDate);
  if (dates.length < 1) {
    return;
  }
  const lastDate = dates[dates.length - 1];
  const nextMissing = calculateNextRecurrence(lastDate, recurrence.period);
  logger.info(
    {
      subscriptionId: recurrence.id,
      title: recurrence.defaults.title,
      period: recurrence.period,
      dates,
      nextMissing: toISODate(nextMissing),
    },
    `Creating ${dates.length} missing expense(s) for subscription ${recurrence.id}`,
  );
  const source = await getSourceById(tx, groupId, recurrence.defaults.sourceId);
  await tx.batch(
    dates.map(date =>
      generateRowFromDefaults(tx, groupId, recurrence.id, recurrence.defaults, source, date),
    ),
  );
  await tx.none(
    `UPDATE subscriptions
        SET next_missing=$/nextMissing/::DATE
        WHERE id=$/subscriptionId/ AND group_id=$/groupId/`,
    {
      nextMissing: toISODate(nextMissing),
      subscriptionId: recurrence.id,
      groupId,
    },
  );
}

/**
 * Recurring-row payload as returned by `createMissingRecurringExpenses`.
 * The query filters out report-style rows (those have NULL `next_missing`
 * and NULL `period_*`), so every field below is guaranteed populated.
 */
interface RecurrenceInDb {
  id: ObjectId;
  defaults: ExpenseDefaults;
  nextMissing: ISODate;
  occursUntil?: ISODate;
  periodAmount: number;
  periodUnit: RecurrenceUnit;
}

/**
 * Populates all missing recurring expenses for this group, up to the given date.
 */
export function createMissingRecurringExpenses(
  tx: DbTask,
  groupId: ObjectId,
  userId: ObjectId,
  date: DateTime,
): Promise<void> {
  return withSpan(
    'recurring.create_missing',
    { 'app.group_id': groupId, 'app.user_id': userId },
    async () => {
      logger.debug('Checking for missing expenses');
      const list = await tx.map<RecurrenceInDb>(
        // `next_missing` is NULL for report-style (non-recurring) rows;
        // the `<` predicate already filters them out, but the explicit
        // period_unit check makes the contract obvious to readers and
        // matches the non-nullable shape of `RecurrenceInDb`.
        `SELECT id, defaults, next_missing, occurs_until, period_amount, period_unit
            FROM subscriptions
            WHERE group_id=$/groupId/
              AND period_unit IS NOT NULL
              AND next_missing < $/nextMissing/::DATE`,
        { groupId, nextMissing: toISODate(date) },
        camelCaseObject,
      );
      await tx.batch(list.map(v => createMissingRecurrences(tx, groupId, date, v)));
    },
  );
}

async function deleteRecurrenceAndExpenses(
  tx: DbTask,
  groupId: ObjectId,
  subscriptionId: ObjectId,
): Promise<ApiMessage> {
  await tx.none(
    `DELETE FROM expenses WHERE subscription_id=$/subscriptionId/ AND group_id=$/groupId/`,
    { subscriptionId, groupId },
  );
  await tx.none(`DELETE FROM subscriptions WHERE id=$/subscriptionId/ AND group_id=$/groupId/`, {
    subscriptionId,
    groupId,
  });
  return {
    status: 'OK',
    message: `Recurrence ${subscriptionId} and its expenses have been deleted`,
  };
}

async function terminateRecurrenceAt(
  tx: DbTask,
  groupId: ObjectId,
  subscriptionId: ObjectId,
  date: DateLike,
) {
  const dateIso = toISODate(date);
  await tx.none(
    `UPDATE subscriptions
        SET occurs_until=$/date/::date
        WHERE id=$/subscriptionId/ AND group_id=$/groupId/`,
    { subscriptionId, date: dateIso, groupId },
  );
}

async function deleteRecurrenceAfter(
  tx: DbTask,
  groupId: ObjectId,
  expenseId: ObjectId,
  afterDate: DateLike,
  subscriptionId: ObjectId,
): Promise<ApiMessage> {
  const afterDateIso = toISODate(afterDate);
  await tx.none(
    `DELETE FROM expenses
        WHERE subscription_id=$/subscriptionId/ AND group_id=$/groupId/
          AND (id=$/expenseId/ OR date > $/afterDate/::date)`,
    { subscriptionId, expenseId, afterDate: afterDateIso, groupId },
  );
  await terminateRecurrenceAt(tx, groupId, subscriptionId, afterDateIso);
  return {
    status: 'OK',
    message: `Expenses after ${afterDateIso} for recurrence ${subscriptionId} have been deleted`,
  };
}

export function deleteRecurringByExpenseId(
  tx: DbTask,
  groupId: ObjectId,
  userId: ObjectId,
  expenseId: ObjectId,
  target: RecurringExpenseTarget,
): Promise<ApiMessage> {
  return withSpan(
    'recurring.delete_by_expense',
    {
      'app.group_id': groupId,
      'app.user_id': userId,
      'app.expense_id': expenseId,
      'app.target': target,
    },
    async () => {
      logger.info(`Deleting recurring via expense ${expenseId} - targeting ${target}`);
      if (target === 'single') {
        return deleteExpenseById(tx, groupId, expenseId);
      }
      const exp = await getExpenseById(tx, groupId, userId, expenseId);
      if (!exp.subscriptionId) {
        throw new InvalidExpense('Not a recurring expense');
      }
      switch (target) {
        case 'all':
          return deleteRecurrenceAndExpenses(tx, groupId, exp.subscriptionId);
        case 'after':
          return deleteRecurrenceAfter(tx, groupId, expenseId, exp.date, exp.subscriptionId);
        default:
          throw new InvalidExpense(`Invalid target ${target}`);
      }
    },
  );
}

/**
 * End ("Lopeta") / delete ("Poista") dispatch for the subscription card's overflow menu.
 *
 * Recurring rows that haven't yet been ended get a soft end — `occurs_until`
 * set to today, history kept, no future generation. Anything else (an
 * already-ended recurring row, or a non-recurring report-style row) is
 * removed entirely; linked expenses keep their data but lose `subscription_id`
 * so there is no dangling FK.
 *
 * `mode` is the caller's asserted intent and must match the row's actual
 * state — guards against a UI race where two rapid clicks would otherwise
 * silently turn "Lopeta" into "Poista".
 */
export function deleteSubscriptionById(
  tx: DbTask,
  groupId: ObjectId,
  subscriptionId: ObjectId,
  mode: SubscriptionDeleteMode,
): Promise<ApiMessage> {
  return withSpan(
    'recurring.delete',
    { 'app.group_id': groupId, 'app.subscription_id': subscriptionId, 'app.mode': mode },
    async () => {
      const row = await getSubscriptionRow(tx, groupId, subscriptionId);
      const isOngoingRecurring = !!row.period && !row.occursUntil;
      const expectedMode: SubscriptionDeleteMode = isOngoingRecurring ? 'end' : 'delete';
      if (mode !== expectedMode) {
        throw new BkError(
          'SUBSCRIPTION_DELETE_MODE_MISMATCH',
          `Subscription ${subscriptionId} is in state requiring mode '${expectedMode}', but '${mode}' was asserted`,
          409,
          { expected: expectedMode, requested: mode },
        );
      }
      if (isOngoingRecurring) {
        const now = toISODate();
        logger.info(`Ending subscription ${row.id} at ${now}`);
        await terminateRecurrenceAt(tx, groupId, subscriptionId, now);
        return { status: 'OK', message: `Subscription ended at ${now}` };
      }
      logger.info(`Removing subscription ${row.id}`);
      await tx.none(
        `UPDATE expenses SET subscription_id = NULL
            WHERE subscription_id = $/subscriptionId/ AND group_id = $/groupId/`,
        { subscriptionId, groupId },
      );
      await tx.none(
        `DELETE FROM subscriptions WHERE id = $/subscriptionId/ AND group_id = $/groupId/`,
        { subscriptionId, groupId },
      );
      return { status: 'OK', message: `Subscription removed` };
    },
  );
}

export function createSubscriptionFromFilter(
  tx: DbTask,
  groupId: ObjectId,
  userId: ObjectId,
  title: string,
  filter: ExpenseQuery,
): Promise<{ status: 'OK'; message: string; subscriptionId: ObjectId }> {
  return withSpan(
    'subscription.create_from_filter',
    { 'app.group_id': groupId, 'app.user_id': userId },
    async () => {
      const id = (
        await tx.one<{ id: number }>(
          `INSERT INTO subscriptions (group_id, user_id, title, filter)
              VALUES ($/groupId/, $/userId/, $/title/, $/filter/::JSONB)
              RETURNING id`,
          { groupId, userId, title, filter },
        )
      ).id;
      return { status: 'OK', message: 'Subscription created', subscriptionId: id };
    },
  );
}

export function updateSubscription(
  tx: DbTask,
  groupId: ObjectId,
  subscriptionId: ObjectId,
  update: SubscriptionUpdate,
): Promise<ApiMessage> {
  return withSpan(
    'subscription.update',
    { 'app.group_id': groupId, 'app.subscription_id': subscriptionId },
    async () => {
      // Always look up the row first so empty / non-existent PATCHes don't
      // silently 200 OK — and so authz errors fire before any group-scoped
      // validation of `defaults` runs.
      const existing = await getSubscriptionRow(tx, groupId, subscriptionId);
      // Recurring rows fan out into a single category-bucketed card and
      // their `defaults` always names a category — clearing the filter's
      // categoryId would orphan the row in the "uncategorized" bucket.
      // Stats rows have no such requirement and can drop the constraint.
      if (update.filter !== undefined && existing.period) {
        const categoryId = update.filter.categoryId;
        const empty =
          categoryId === undefined ||
          categoryId === null ||
          (Array.isArray(categoryId) && categoryId.length === 0);
        if (empty) {
          throw new InvalidInputError(
            'INVALID_INPUT',
            'Recurring subscriptions must keep a category constraint in their filter',
          );
        }
      }
      if (update.defaults !== undefined) {
        // Defaults references must resolve in the session group: getCategoryById,
        // getSourceById, and getUserById all throw NotFoundError when the id is
        // outside the group, so a malicious blob can't slip past Zod validation.
        await getCategoryById(tx, groupId, update.defaults.categoryId);
        await getSourceById(tx, groupId, update.defaults.sourceId);
        await getUserById(tx, groupId, update.defaults.userId);
      }
      const sets: string[] = [];
      const params: Record<string, unknown> = { groupId, subscriptionId };
      if (update.title !== undefined) {
        sets.push(`title = $/title/`);
        params.title = update.title;
      }
      if (update.filter !== undefined) {
        sets.push(`filter = $/filter/::JSONB`);
        params.filter = update.filter;
      }
      if (update.defaults !== undefined) {
        sets.push(`defaults = $/defaults/::JSONB`);
        params.defaults = update.defaults;
      }
      if (sets.length === 0) {
        return { status: 'OK', message: 'Subscription unchanged' };
      }
      await tx.none(
        `UPDATE subscriptions SET ${sets.join(', ')}
            WHERE id = $/subscriptionId/ AND group_id = $/groupId/`,
        params,
      );
      return { status: 'OK', message: 'Subscription updated' };
    },
  );
}

function deleteDivisionForRecurrence(
  tx: DbTask,
  groupId: ObjectId,
  subscriptionId: ObjectId,
  afterDate: DateLike | null,
  editedId: ObjectId | null,
): Promise<null> {
  return tx.none(
    `DELETE FROM expense_division
      WHERE expense_id IN (
        SELECT id FROM expenses
        WHERE subscription_id=$/subscriptionId/::INTEGER
          AND group_id=$/groupId/
          AND ($/afterDate/::DATE IS NULL OR id=$/editedId/::INTEGER OR date > $/afterDate/::DATE)
      )`,
    { subscriptionId, afterDate, editedId, groupId },
  );
}

async function getRecurrenceExpenseIds(
  tx: DbTask,
  groupId: ObjectId,
  subscriptionId: ObjectId,
  afterDate: DateLike | null,
  editedId: ObjectId | null,
): Promise<number[]> {
  return (
    await tx.manyOrNone<{ id: number }>(
      `SELECT id
        FROM expenses
        WHERE subscription_id=$/subscriptionId/
          AND group_id=$/groupId/
          AND ($/afterDate/::DATE IS NULL OR id=$/editedId/::INTEGER OR date > $/afterDate/::DATE)`,
      { subscriptionId, afterDate, editedId, groupId },
    )
  ).map(e => e.id);
}

async function createDivisionForRecurrence(
  tx: DbTask,
  groupId: ObjectId,
  subscriptionId: ObjectId,
  division: ExpenseDivisionItem[],
  afterDate: DateLike | null,
  editedId: ObjectId | null,
): Promise<number> {
  const ids = await getRecurrenceExpenseIds(tx, groupId, subscriptionId, afterDate, editedId);
  for (const expenseId of ids) {
    for (const d of division) {
      await storeExpenseDivision(tx, expenseId, d.userId, d.type, d.sum);
    }
  }
  return subscriptionId;
}

async function updateRecurringExpense(
  tx: DbTask,
  target: RecurringExpenseTarget,
  original: Expense,
  expenseInput: ExpenseInput,
  defaultSourceId: number,
): Promise<ApiMessage> {
  if (!original.subscriptionId) {
    throw new InvalidExpense(`Invalid target ${target}`);
  }
  const expense = setExpenseDataDefaults(expenseInput);
  logger.debug({ original, expense }, `Updating recurring expense`);
  const sourceId = expense.sourceId || defaultSourceId;
  const cat = await getCategoryById(tx, original.groupId, expense.categoryId);
  const source = await getSourceById(tx, original.groupId, sourceId);
  await tx.none(
    `UPDATE expenses
      SET date=$/date/::DATE, receiver=$/receiver/, sum=$/sum/, title=$/title/,
        description=$/description/, type=$/type/::expense_type, confirmed=$/confirmed/::BOOLEAN,
        source_id=$/sourceId/::INTEGER, category_id=$/categoryId/::INTEGER
      WHERE id=$/id/ AND group_id=$/groupId/`,
    {
      ...expense,
      id: original.id,
      sum: expense.sum.toString(),
      sourceId: source.id,
      categoryId: cat.id,
      groupId: original.groupId,
    },
  );
  const division = determineDivision(expense, source);
  // 'after' uses `id = $editedId OR date > $editedDate` — the same precise predicate
  // `deleteRecurrenceAfter` uses, replacing the older `date >= afterDate` rule which
  // had a same-date ambiguity (see docs/archive/SUBSCRIPTIONS_REWORK_PLAN.md → Edit propagation).
  // The same predicate flows into the division ops below so attributes and divisions
  // stay in sync for same-date sibling rows.
  const afterDate = target === 'after' ? original.date : null;
  const editedId = target === 'after' ? original.id : null;
  await tx.none(
    `UPDATE expenses
      SET receiver=$/receiver/, sum=$/sum/, title=$/title/, description=$/description/,
        type=$/type/::expense_type, confirmed=$/confirmed/::BOOLEAN,
        source_id=$/sourceId/::INTEGER, category_id=$/categoryId/::INTEGER
      WHERE subscription_id=$/subscriptionId/ AND group_id=$/groupId/
        AND ($/afterDate/::DATE IS NULL OR id = $/editedId/::INTEGER OR date > $/afterDate/::DATE)`,
    {
      ...expense,
      subscriptionId: original.subscriptionId,
      editedId,
      afterDate,
      sum: expense.sum.toString(),
      sourceId: source.id,
      categoryId: cat.id,
      groupId: original.groupId,
    },
  );
  // Mirror the change onto the subscription's defaults so future generation picks it up.
  const newDefaults: ExpenseDefaults = {
    title: expense.title,
    ...(expense.receiver ? { receiver: expense.receiver } : {}),
    sum: Money.toString(expense.sum),
    type: expense.type,
    sourceId: source.id,
    categoryId: cat.id,
    userId: expense.userId,
    confirmed: expense.confirmed,
    description: expense.description ?? null,
  };
  await tx.none(
    `UPDATE subscriptions
        SET defaults = $/defaults/::JSONB
        WHERE id = $/subscriptionId/ AND group_id = $/groupId/`,
    {
      subscriptionId: original.subscriptionId,
      defaults: newDefaults,
      groupId: original.groupId,
    },
  );
  await deleteDivisionForRecurrence(
    tx,
    original.groupId,
    original.subscriptionId,
    afterDate,
    editedId,
  );
  await createDivisionForRecurrence(
    tx,
    original.groupId,
    original.subscriptionId,
    division,
    afterDate,
    editedId,
  );
  // Extra fields (expenseId, subscriptionId) pass through to clients using type guards.
  const result = {
    status: 'OK',
    message: 'Recurring expenses updated',
    expenseId: original.id,
    subscriptionId: original.subscriptionId,
  };
  return result;
}

export function updateRecurringExpenseByExpenseId(
  tx: DbTask,
  groupId: ObjectId,
  userId: ObjectId,
  expenseId: ObjectId,
  target: RecurringExpenseTarget,
  expense: ExpenseInput,
  defaultSourceId: number,
): Promise<ApiMessage> {
  return withSpan(
    'recurring.update',
    {
      'app.group_id': groupId,
      'app.user_id': userId,
      'app.expense_id': expenseId,
      'app.target': target,
    },
    async () => {
      logger.info(`Updating recurring expense ${expenseId} - targeting ${target}`);
      const org = await getExpenseById(tx, groupId, userId, expenseId);
      if (!org.subscriptionId) {
        throw new InvalidExpense(`${expenseId} is not a recurring expense`);
      }
      if (target === 'single') {
        return updateExpense(tx, org, expense, defaultSourceId);
      }
      return updateRecurringExpense(tx, target, org, expense, defaultSourceId);
    },
  );
}
