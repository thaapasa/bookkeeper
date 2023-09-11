import debug from 'debug';
import { Moment } from 'moment';
import { ITask } from 'pg-promise';

import { ExpenseCollection, ExpenseStatus, UserExpense } from 'shared/expense';
import * as time from 'shared/time';
import { mapValues, Money } from 'shared/util';

import { countTotalBetween, dbRowToExpense, expenseSelectClause, hasUnconfirmedBefore } from './BasicExpenseDb';
import { createMissingRecurringExpenses } from './RecurringExpenseDb';

const log = debug('bookkeeper:api:expenses');

function calculateBalance(o: ExpenseStatus): ExpenseStatus {
  const value = Money.from(o.cost).plus(o.benefit).plus(o.income).plus(o.split).plus(o.transferor).plus(o.transferee);
  return {
    ...o,
    value: value.toString(),
    balance: value.negate().toString(),
  };
}

async function getBetween(
  tx: ITask<any>,
  groupId: number,
  userId: number,
  startDate: Moment | string,
  endDate: Moment | string,
) {
  log(`Querying for expenses between ${time.iso(startDate)} and ${time.iso(endDate)} for group ${groupId}`);
  const expenses = await tx.manyOrNone<UserExpense>(
    expenseSelectClause(
      `WHERE group_id=$/groupId/ AND template=false
        AND date >= $/startDate/::DATE AND date < $/endDate/::DATE`,
    ),
    {
      userId,
      groupId,
      startDate: time.toISODate(startDate),
      endDate: time.toISODate(endDate),
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
  tx: ITask<any>,
  groupId: number,
  userId: number,
  year: number,
  month: number,
): Promise<ExpenseCollection> {
  const startDate = time.month(year, month);
  const endDate = startDate.clone().add(1, 'months');
  await createMissingRecurringExpenses(tx, groupId, userId, endDate);
  const [expenses, startStatus, monthStatus, unconfirmedBefore] = await Promise.all([
    getBetween(tx, groupId, userId, startDate, endDate),
    countTotalBetween(tx, groupId, userId, '2000-01', startDate).then(calculateBalance),
    countTotalBetween(tx, groupId, userId, startDate, endDate).then(calculateBalance),
    hasUnconfirmedBefore(tx, groupId, startDate),
  ]);
  const endStatus = mapValues(
    k =>
      Money.from(startStatus[k])
        .plus(monthStatus[k])
        .toString(),
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
