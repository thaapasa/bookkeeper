import debug from 'debug';
import { Moment } from 'moment';
import { IBaseProtocol } from 'pg-promise';

import {
  ExpenseCollection,
  ExpenseStatus,
  UserExpense,
} from 'shared/types/Expense';
import Money from 'shared/util/Money';
import { mapValues } from 'shared/util/Objects';
import * as time from 'shared/util/Time';

import { BasicExpenseDb as basic } from './BasicExpensesDb';
import { createExpense } from './BasicExpensesService';
import { db } from './Db';
import split from './ExpenseSplit';
import recurring from './RecurringExpenses';

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

function getBetween(tx: IBaseProtocol<any>) {
  return async (
    groupId: number,
    userId: number,
    startDate: Moment | string,
    endDate: Moment | string
  ) => {
    log(
      'Querying for expenses between',
      time.iso(startDate),
      'and',
      time.iso(endDate),
      'for group',
      groupId
    );
    const expenses = await tx.manyOrNone<UserExpense>(
      basic.expenseSelect(
        `WHERE group_id=$/groupId/ AND template=false AND date >= $/startDate/::DATE AND date < $/endDate/::DATE`
      ),
      {
        userId,
        groupId,
        startDate: time.toISODate(startDate),
        endDate: time.toISODate(endDate),
      }
    );
    return expenses.map(basic.mapExpense);
  };
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

function getByMonth(
  groupId: number,
  userId: number,
  year: number,
  month: number
): Promise<ExpenseCollection> {
  const startDate = time.month(year, month);
  const endDate = startDate.clone().add(1, 'months');
  return db.tx(async (tx): Promise<ExpenseCollection> => {
    await recurring.tx.createMissing(tx)(groupId, userId, endDate);
    const [expenses, startStatus, monthStatus, unconfirmedBefore] =
      await Promise.all([
        getBetween(tx)(groupId, userId, startDate, endDate),
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
  });
}

export default {
  getAll: basic.getAll,
  getByMonth,
  getById: basic.getById,
  getDivision: basic.getDivision,
  deleteById: basic.deleteById,
  queryReceivers: basic.queryReceivers,
  create: createExpense,
  update: basic.update,
  split: split.split,
  createRecurring: recurring.createRecurring,
  deleteRecurringById: recurring.deleteRecurringById,
  updateRecurring: recurring.updateRecurring,
};
