import debug from 'debug';
import { Moment } from 'moment';
import { ITask } from 'pg-promise';

import { ExpenseCollection, ExpenseStatus, UserExpense } from 'shared/expense';
import * as time from 'shared/time';
import { mapValues, Money } from 'shared/util';

import { BasicExpenseDb as basic } from './BasicExpenseDb';
import { createExpense } from './BasicExpenseService';
import { splitExpense } from './ExpenseSplit';
import { RecurringExpenseDb } from './RecurringExpenseDb';

const log = debug('bookkeeper:api:expenses');

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
  tx: ITask<any>,
  groupId: number,
  userId: number,
  startDate: Moment | string,
  endDate: Moment | string
) {
  log(
    `Querying for expenses between ${time.iso(startDate)} and ${time.iso(
      endDate
    )} for group ${groupId}`
  );
  const expenses = await tx.manyOrNone<UserExpense>(
    basic.expenseSelect(
      `WHERE group_id=$/groupId/ AND template=false
        AND date >= $/startDate/::DATE AND date < $/endDate/::DATE`
    ),
    {
      userId,
      groupId,
      startDate: time.toISODate(startDate),
      endDate: time.toISODate(endDate),
    }
  );
  return expenses.map(basic.mapExpense);
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

async function getByMonth(
  tx: ITask<any>,
  groupId: number,
  userId: number,
  year: number,
  month: number
): Promise<ExpenseCollection> {
  const startDate = time.month(year, month);
  const endDate = startDate.clone().add(1, 'months');
  await RecurringExpenseDb.createMissing(tx, groupId, userId, endDate);
  const [expenses, startStatus, monthStatus, unconfirmedBefore] =
    await Promise.all([
      getBetween(tx, groupId, userId, startDate, endDate),
      basic
        .countTotalBetween(tx, groupId, userId, '2000-01', startDate)
        .then(calculateBalance),
      basic
        .countTotalBetween(tx, groupId, userId, startDate, endDate)
        .then(calculateBalance),
      basic.hasUnconfirmedBefore(tx, groupId, startDate),
    ]);
  const endStatus = mapValues(
    k => Money.from(startStatus[k]).plus(monthStatus[k]).toString(),
    zeroStatus
  );
  return {
    expenses,
    startStatus,
    monthStatus,
    endStatus,
    unconfirmedBefore,
  };
}

export const Expenses = {
  getByMonth,
  getById: basic.getById,
  getDivision: basic.getDivision,
  deleteById: basic.deleteById,
  queryReceivers: basic.queryReceivers,
  renameReceiver: basic.renameReceiver,
  create: createExpense,
  update: basic.update,
  split: splitExpense,
  searchRecurringExpenses: RecurringExpenseDb.searchRecurringExpenses,
  createRecurring: RecurringExpenseDb.createRecurring,
  deleteRecurringById: RecurringExpenseDb.deleteRecurringById,
  updateRecurring: RecurringExpenseDb.updateRecurring,
};
