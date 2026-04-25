import { DateTime } from 'luxon';

import {
  Expense,
  ExpenseDefaults,
  ExpenseDivisionItem,
  ExpenseInput,
  ExpenseQuery,
  ExpenseType,
  Recurrence,
  RecurrencePeriod,
  RecurrenceUnit,
  RecurringExpense,
  RecurringExpenseDetails,
  RecurringExpenseInput,
  RecurringExpenseTarget,
} from 'shared/expense';
import { DateLike, ISODate, ISOTimestamp, toDateTime, toISODate } from 'shared/time';
import {
  ApiMessage,
  ExpenseIdResponse,
  InvalidExpense,
  InvalidInputError,
  NotFoundError,
  ObjectId,
  RecurringExpenseCreatedResponse,
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
import { getExpenseAndDivisionData, updateExpenseById } from './BasicExpenseService';
import { getCategoryById } from './CategoryDb';
import { determineDivision } from './ExpenseDivision';
import { calculateNextRecurrence } from './RecurringExpenseService';
import { getSourceById } from './SourceDb';

export function filterFromExpense(expense: Expense): ExpenseQuery {
  const filter: ExpenseQuery = { categoryId: expense.categoryId };
  if (expense.receiver) filter.receiver = expense.receiver;
  return filter;
}

export function defaultsFromExpense(
  expense: Expense,
  division: ExpenseDivisionItem[],
): ExpenseDefaults {
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
    division: division.map(d => ({ ...d, sum: Money.toString(d.sum) })),
  };
}

export interface RecurringRow {
  id: ObjectId;
  filter: ExpenseQuery;
  defaults: ExpenseDefaults;
  period: RecurrencePeriod;
  nextMissing: ISODate;
  occursUntil: ISODate | null;
  type: ExpenseType;
  title: string;
  receiver: string;
  sum: string;
  categoryId: ObjectId;
  templateUserId: ObjectId;
}

interface RecurringRowDb {
  id: ObjectId;
  filter: ExpenseQuery;
  defaults: ExpenseDefaults;
  periodUnit: RecurrenceUnit;
  periodAmount: number;
  nextMissing: ISODate;
  occursUntil: ISODate | null;
}

const RecurringRowSelect = `--sql
  SELECT
    id AS "id",
    filter AS "filter",
    defaults AS "defaults",
    period_unit AS "periodUnit",
    period_amount AS "periodAmount",
    next_missing AS "nextMissing",
    occurs_until AS "occursUntil"
    FROM subscriptions
`;

function dbRowToRecurringRow(row: RecurringRowDb): RecurringRow {
  const d = row.defaults;
  return {
    id: row.id,
    filter: row.filter,
    defaults: d,
    period: { amount: row.periodAmount, unit: row.periodUnit },
    nextMissing: toISODate(row.nextMissing),
    occursUntil: row.occursUntil ? toISODate(row.occursUntil) : null,
    type: d.type,
    title: d.title,
    receiver: d.receiver ?? '',
    sum: Money.from(d.sum).toString(),
    categoryId: d.categoryId,
    templateUserId: d.userId,
  };
}

/**
 * Returns every recurring-expense row in the group with its filter,
 * defaults, and the display fields needed to render a subscription
 * card. Display fields come from `defaults` JSONB (the template
 * expense row was dropped in step 5 of the rework).
 */
export async function getRecurringRows(tx: DbTask, groupId: ObjectId): Promise<RecurringRow[]> {
  const rows = await tx.manyOrNone<RecurringRowDb>(
    `${RecurringRowSelect} WHERE group_id = $/groupId/`,
    { groupId },
  );
  return rows.map(dbRowToRecurringRow);
}

async function getRecurringRow(
  tx: DbTask,
  groupId: ObjectId,
  subscriptionId: ObjectId,
): Promise<RecurringRow> {
  const row = await tx.oneOrNone<RecurringRowDb>(
    `${RecurringRowSelect} WHERE group_id = $/groupId/ AND id = $/subscriptionId/`,
    { groupId, subscriptionId },
  );
  if (!row) {
    throw new NotFoundError('SUBSCRIPTION_NOT_FOUND', `Subscription`, subscriptionId);
  }
  return dbRowToRecurringRow(row);
}

function recurringRowToRecurringExpense(row: RecurringRow): RecurringExpense {
  return {
    id: row.id,
    type: 'recurring',
    title: row.title,
    receiver: row.receiver || undefined,
    sum: row.sum,
    categoryId: row.categoryId,
    period: row.period,
    nextMissing: row.nextMissing,
    firstOccurence: undefined,
    occursUntil: row.occursUntil ?? undefined,
    recurrencePerMonth: '0',
    recurrencePerYear: '0',
  };
}

/**
 * Detail-view helper for a single subscription. Per-month/year baselines
 * are zeroed here — the user-facing aggregation goes through
 * SubscriptionService.searchSubscriptions, which runs the full dedup
 * pass. Detail consumers (`/api/subscription/:subscriptionId`) only
 * need the row's title, recurrence, and totals.
 */
async function getRecurringExpenseInfo(
  tx: DbTask,
  groupId: ObjectId,
  subscriptionId: ObjectId,
): Promise<RecurringExpense> {
  return recurringRowToRecurringExpense(await getRecurringRow(tx, groupId, subscriptionId));
}

export function getRecurringExpenseDetails(
  tx: DbTask,
  groupId: ObjectId,
  userId: ObjectId,
  subscriptionId: ObjectId,
): Promise<RecurringExpenseDetails> {
  return withSpan(
    'recurring.details',
    {
      'app.group_id': groupId,
      'app.user_id': userId,
      'app.subscription_id': subscriptionId,
    },
    async () => {
      const recurringExpense = await getRecurringExpenseInfo(tx, groupId, subscriptionId);
      const totals = await tx.one<{ count: number; sum: string | null }>(
        `SELECT COUNT(*) AS "count", COALESCE(SUM(sum), '0') AS "sum"
           FROM expenses
          WHERE subscription_id = $/subscriptionId/`,
        { subscriptionId },
      );
      const firstOccurence = await getFirstOccurrence(tx, groupId, subscriptionId);
      const lastOccurence = await getLastOccurrence(tx, groupId, subscriptionId);
      return {
        recurringExpense: { ...recurringExpense, firstOccurence: firstOccurence?.date },
        totalExpenses: totals.count,
        totalSum: totals.sum ?? '0',
        firstOccurence,
        lastOccurence,
      };
    },
  );
}

async function getFirstOccurrence(
  tx: DbTask,
  groupId: ObjectId,
  subscriptionId: ObjectId,
): Promise<Expense | undefined> {
  return getOccurrence(tx, groupId, subscriptionId, 'ASC');
}

async function getLastOccurrence(
  tx: DbTask,
  groupId: ObjectId,
  subscriptionId: ObjectId,
): Promise<Expense | undefined> {
  return getOccurrence(tx, groupId, subscriptionId, 'DESC');
}

async function getOccurrence(
  tx: DbTask,
  groupId: ObjectId,
  subscriptionId: ObjectId,
  order: 'ASC' | 'DESC',
): Promise<Expense | undefined> {
  const row = await tx.oneOrNone<{
    id: ObjectId;
    date: ISODate;
    sum: string;
    title: string;
    receiver: string | null;
    description: string | null;
    type: ExpenseType;
    confirmed: boolean;
    sourceId: ObjectId;
    categoryId: ObjectId;
    userId: ObjectId;
    createdById: ObjectId;
    created: ISOTimestamp;
    subscriptionId: ObjectId | null;
    groupId: ObjectId;
    groupingId: ObjectId | null;
  }>(
    `SELECT id, date::DATE AS date, sum, title, receiver, description, type, confirmed,
            source_id AS "sourceId", category_id AS "categoryId", user_id AS "userId",
            created_by_id AS "createdById", created, subscription_id AS "subscriptionId",
            group_id AS "groupId", grouping_id AS "groupingId"
       FROM expenses
      WHERE subscription_id = $/subscriptionId/ AND group_id = $/groupId/
      ORDER BY date ${order}, id ${order}
      LIMIT 1`,
    { subscriptionId, groupId },
  );
  if (!row) return undefined;
  return {
    ...row,
    receiver: row.receiver ?? '',
    groupingId: row.groupingId ?? undefined,
    date: toISODate(row.date),
  };
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
      const [expense, division] = await getExpenseAndDivisionData(tx, groupId, userId, expenseId);
      if (expense.subscriptionId && expense.subscriptionId > 0) {
        throw new InvalidInputError(
          'INVALID_INPUT',
          `Expense ${expenseId} is already a recurring expense (${expense.subscriptionId})`,
        );
      }
      const nextMissing = calculateNextRecurrence(expense.date, recurrence.period);
      const filter = filterFromExpense(expense);
      const defaults = defaultsFromExpense(expense, division);
      const subscriptionId = (
        await tx.one<{ id: number }>(
          `INSERT INTO subscriptions (period_amount, period_unit, next_missing, group_id, filter, defaults)
              VALUES ($/periodAmount/, $/periodUnit/, $/nextMissing/::DATE, $/groupId/, $/filter/::JSONB, $/defaults/::JSONB)
              RETURNING id`,
          {
            periodAmount: recurrence.period.amount,
            periodUnit: recurrence.period.unit,
            nextMissing: toISODate(nextMissing),
            groupId,
            filter,
            defaults,
          },
        )
      ).id;

      await tx.none(
        `UPDATE expenses
            SET subscription_id = $/subscriptionId/
            WHERE id = $/expenseId/`,
        { subscriptionId, expenseId },
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
  let division = defaults.division;
  if (!division) {
    const source = await getSourceById(tx, groupId, defaults.sourceId);
    division = determineDivision(insert, source);
  }
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
    `Creating missing expenses for ${recurrence} ${dates}. Next missing is ${toISODate(nextMissing)}`,
  );
  await tx.batch(
    dates.map(date =>
      generateRowFromDefaults(tx, groupId, recurrence.id, recurrence.defaults, date),
    ),
  );
  await tx.none(
    `UPDATE subscriptions
        SET next_missing=$/nextMissing/::DATE
        WHERE id=$/subscriptionId/`,
    {
      nextMissing: toISODate(nextMissing),
      subscriptionId: recurrence.id,
    },
  );
}

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
        `SELECT id, defaults, next_missing, occurs_until, period_amount, period_unit
            FROM subscriptions
            WHERE group_id=$/groupId/ AND next_missing < $/nextMissing/::DATE`,
        { groupId, nextMissing: date },
        camelCaseObject,
      );
      await tx.batch(list.map(v => createMissingRecurrences(tx, groupId, date, v)));
    },
  );
}

async function deleteRecurrenceAndExpenses(
  tx: DbTask,
  subscriptionId: ObjectId,
): Promise<ApiMessage> {
  await tx.none(`DELETE FROM expenses WHERE subscription_id=$/subscriptionId/`, {
    subscriptionId,
  });
  await tx.none(`DELETE FROM subscriptions WHERE id=$/subscriptionId/`, {
    subscriptionId,
  });
  return {
    status: 'OK',
    message: `Recurrence ${subscriptionId} and its expenses have been deleted`,
  };
}

async function terminateRecurrenceAt(tx: DbTask, subscriptionId: ObjectId, date: DateLike) {
  await tx.none(
    `UPDATE subscriptions
        SET occurs_until=$/date/::date
        WHERE id=$/subscriptionId/`,
    { subscriptionId, date },
  );
}

async function deleteRecurrenceAfter(
  tx: DbTask,
  expenseId: ObjectId,
  afterDate: DateLike,
  subscriptionId: ObjectId,
): Promise<ApiMessage> {
  await tx.none(
    `DELETE FROM expenses
        WHERE subscription_id=$/subscriptionId/ AND (id=$/expenseId/ OR date > $/afterDate/::date)`,
    { subscriptionId, expenseId, afterDate },
  );
  await terminateRecurrenceAt(tx, subscriptionId, afterDate);
  return {
    status: 'OK',
    message: `Expenses after ${afterDate} for recurrence ${subscriptionId} have been deleted`,
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
          return deleteRecurrenceAndExpenses(tx, exp.subscriptionId);
        case 'after':
          return deleteRecurrenceAfter(tx, expenseId, exp.date, exp.subscriptionId);
        default:
          throw new InvalidExpense(`Invalid target ${target}`);
      }
    },
  );
}

export function deleteRecurringExpenseById(
  tx: DbTask,
  groupId: ObjectId,
  subscriptionId: ObjectId,
): Promise<ApiMessage> {
  return withSpan(
    'recurring.delete',
    { 'app.group_id': groupId, 'app.subscription_id': subscriptionId },
    async () => {
      const recurring = await getRecurringExpenseInfo(tx, groupId, subscriptionId);
      const now = toISODate();
      logger.info(`Deleting recurring ${recurring.id} at ${now}`);

      await terminateRecurrenceAt(tx, subscriptionId, now);
      return { status: 'OK', message: `Recurrence cleared at ${now}` };
    },
  );
}

export function updateSubscriptionDefaults(
  tx: DbTask,
  groupId: ObjectId,
  subscriptionId: ObjectId,
  defaults: ExpenseDefaults,
): Promise<ExpenseIdResponse> {
  return withSpan(
    'recurring.update_defaults',
    { 'app.group_id': groupId, 'app.subscription_id': subscriptionId },
    async () => {
      const res = await tx.result(
        `UPDATE subscriptions
            SET defaults = $/defaults/::JSONB
            WHERE id = $/subscriptionId/ AND group_id = $/groupId/`,
        { groupId, subscriptionId, defaults },
      );
      if (res.rowCount === 0) {
        throw new NotFoundError('SUBSCRIPTION_NOT_FOUND', 'subscription', subscriptionId);
      }
      return { status: 'OK', message: 'Subscription defaults updated', expenseId: subscriptionId };
    },
  );
}

function deleteDivisionForRecurrence(
  tx: DbTask,
  subscriptionId: ObjectId,
  afterDate: DateLike | null,
): Promise<null> {
  return tx.none(
    `DELETE FROM expense_division
      WHERE expense_id IN (
        SELECT id FROM expenses
        WHERE subscription_id=$/subscriptionId/::INTEGER
          AND ($/afterDate/ IS NULL OR date >= $/afterDate/)
      )`,
    { subscriptionId, afterDate },
  );
}

async function getRecurrenceExpenseIds(
  tx: DbTask,
  subscriptionId: ObjectId,
  afterDate: DateLike | null,
): Promise<number[]> {
  return (
    await tx.manyOrNone<{ id: number }>(
      `SELECT id
        FROM expenses
        WHERE subscription_id=$/subscriptionId/
          AND ($/afterDate/ IS NULL OR date >= $/afterDate/)`,
      { subscriptionId, afterDate },
    )
  ).map(e => e.id);
}

async function createDivisionForRecurrence(
  tx: DbTask,
  subscriptionId: ObjectId,
  division: ExpenseDivisionItem[],
  afterDate: DateLike | null,
): Promise<number> {
  const ids = await getRecurrenceExpenseIds(tx, subscriptionId, afterDate);
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
      WHERE id=$/id/`,
    {
      ...expense,
      id: original.id,
      sum: expense.sum.toString(),
      sourceId: source.id,
      categoryId: cat.id,
    },
  );
  const division = determineDivision(expense, source);
  // 'after' uses `id = $editedId OR date > $editedDate` — the same precise predicate
  // `deleteRecurrenceAfter` uses, replacing the older `date >= afterDate` rule which
  // had a same-date ambiguity (see SUBSCRIPTIONS_REWORK_PLAN.md → Edit propagation).
  const afterDate = target === 'after' ? original.date : null;
  await tx.none(
    `UPDATE expenses
      SET receiver=$/receiver/, sum=$/sum/, title=$/title/, description=$/description/,
        type=$/type/::expense_type, confirmed=$/confirmed/::BOOLEAN,
        source_id=$/sourceId/::INTEGER, category_id=$/categoryId/::INTEGER
      WHERE subscription_id=$/subscriptionId/
        AND ($/editedId/::INTEGER IS NULL OR id = $/editedId/ OR date > $/afterDate/::DATE)`,
    {
      ...expense,
      subscriptionId: original.subscriptionId,
      editedId: target === 'after' ? original.id : null,
      afterDate,
      sum: expense.sum.toString(),
      sourceId: source.id,
      categoryId: cat.id,
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
    division: division.map(d => ({ ...d, sum: Money.toString(d.sum) })),
  };
  await tx.none(
    `UPDATE subscriptions
        SET defaults = $/defaults/::JSONB
        WHERE id = $/subscriptionId/`,
    { subscriptionId: original.subscriptionId, defaults: newDefaults },
  );
  await deleteDivisionForRecurrence(tx, original.subscriptionId, afterDate);
  await createDivisionForRecurrence(tx, original.subscriptionId, division, afterDate);
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

// Re-exported convenience for callers that previously imported updateExpenseById through here.
export { updateExpenseById };
