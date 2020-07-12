import { db } from './Db';
import * as time from '../../shared/util/Time';
import Money from '../../shared/util/Money';
import recurring from './RecurringExpenses';
import basic from './BasicExpenses';
import {
  ExpenseCollection,
  ExpenseStatus,
  UserExpense,
} from '../../shared/types/Expense';
import { Moment } from 'moment';
import { mapValues } from '../../shared/util/Objects';
import { IBaseProtocol } from 'pg-promise';
import debug from 'debug';

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
  return db.tx(
    async (tx): Promise<ExpenseCollection> => {
      await recurring.tx.createMissing(tx)(groupId, userId, endDate);
      const [
        expenses,
        startStatus,
        monthStatus,
        unconfirmedBefore,
      ] = await Promise.all([
        getBetween(tx)(groupId, userId, startDate, endDate),
        basic.tx
          .countTotalBetween(tx)(groupId, userId, '2000-01', startDate)
          .then(calculateBalance),
        basic.tx
          .countTotalBetween(tx)(groupId, userId, startDate, endDate)
          .then(calculateBalance),
        basic.tx.hasUnconfirmedBefore(tx)(groupId, startDate),
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
  );
}

export default {
  getAll: basic.getAll,
  getByMonth,
  getById: basic.getById,
  getDivision: basic.getDivision,
  deleteById: basic.deleteById,
  queryReceivers: basic.queryReceivers,
  create: basic.create,
  update: basic.update,
  createRecurring: recurring.createRecurring,
  deleteRecurringById: recurring.deleteRecurringById,
  updateRecurring: recurring.updateRecurring,
};
