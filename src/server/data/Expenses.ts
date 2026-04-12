import { ExpenseCollection, ExpenseStatus, UserExpense } from 'shared/expense';
import { dateTimeFromParts, DateTimeInput, toISODate, toISOTimestamp } from 'shared/time';
import { mapValues, Money } from 'shared/util';
import { DbTask } from 'server/data/Db.ts';
import { logger } from 'server/Logger';

import {
  countTotalBetween,
  dbRowToExpense,
  expenseSelectClause,
  hasUnconfirmedBefore,
} from './BasicExpenseDb';
import { createMissingRecurringExpenses } from './RecurringExpenseDb';

function calculateBalance(o: ExpenseStatus): ExpenseStatus {
  const value = Money.from(o.cost)
    .plus(o.benefit)
    .plus(o.income)
    .plus(o.split)
    .plus(o.transferor)
    .plus(o.transferee);
  return {
    ...o,
    value: value.toString(),
    balance: value.negate().toString(),
  };
}

async function getBetween(
  tx: DbTask,
  groupId: number,
  userId: number,
  startDate: DateTimeInput,
  endDate: DateTimeInput,
) {
  logger.debug(
    `Querying for expenses between ${toISOTimestamp(startDate)} and ${toISOTimestamp(
      endDate,
    )} for group ${groupId}`,
  );
  const expenses = await tx.manyOrNone<UserExpense>(
    expenseSelectClause(
      `WHERE e.group_id=$/groupId/ AND template=false
        AND date >= $/startDate/::DATE AND date < $/endDate/::DATE`,
    ),
    {
      userId,
      groupId,
      startDate: toISODate(startDate),
      endDate: toISODate(endDate),
    },
  );
  return expenses.map(dbRowToExpense);
}

const zeroStatus: ExpenseStatus = {
  balance: '0.00',
  benefit: '0.00',
  cost: '0.00',
  income: '0.00',
  split: '0.00',
  value: '0.00',
  transferor: '0.00',
  transferee: '0.00',
};

export async function getExpensesByMonth(
  tx: DbTask,
  groupId: number,
  userId: number,
  year: number,
  month: number,
): Promise<ExpenseCollection> {
  const startDate = dateTimeFromParts(year, month, 1);
  const endDate = startDate.plus({ months: 1 });
  await createMissingRecurringExpenses(tx, groupId, userId, endDate);
  const expenses = await getBetween(tx, groupId, userId, startDate, endDate);
  const startStatus = calculateBalance(
    await countTotalBetween(tx, groupId, userId, '2000-01', startDate),
  );
  const monthStatus = calculateBalance(
    await countTotalBetween(tx, groupId, userId, startDate, endDate),
  );
  const unconfirmedBefore = await hasUnconfirmedBefore(tx, groupId, startDate);
  const endStatus = mapValues(
    k => Money.from(startStatus[k]).plus(monthStatus[k]).toString(),
    zeroStatus,
  );
  return {
    expenses,
    startStatus,
    monthStatus,
    endStatus,
    unconfirmedBefore,
  };
}
