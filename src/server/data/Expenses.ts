import { db, DbAccess } from './Db';
import * as time from '../../shared/util/time';
import Money from '../../shared/util/money';
import recurring from './RecurringExpenses';
import basic from './BasicExpenses';
import { ExpenseCollection, ExpenseStatus, UserExpense } from '../../shared/types/expense';
import { mapObject } from '../../shared/util/arrays';
import { Moment } from 'moment';
const debug = require('debug')('bookkeeper:api:expenses');

function calculateBalance(o: ExpenseStatus): ExpenseStatus {
  const value = Money.from(o.cost).plus(o.benefit).plus(o.income).plus(o.split);
  return Object.assign(o, {
    value: value.toString(),
    balance: value.negate().toString()
  })
}

function getBetween(tx: DbAccess) {
  return (groupId: number, userId: number, startDate: Moment | string, endDate: Moment | string) => {
    debug('Querying for expenses between', time.iso(startDate), 'and', time.iso(endDate), 'for group', groupId);
    return tx.queryList('expenses.get_between',
      basic.expenseSelect('WHERE group_id=$2 AND template=false AND date >= $3::DATE AND date < $4::DATE'),
      [userId, groupId, time.date(startDate), time.date(endDate)])
      .then(l => l.map(basic.mapExpense));
  }
}

const zeroStatus: ExpenseStatus = {
  balance: '0.00',
  benefit: '0.00',
  cost: '0.00',
  income: '0.00',
  split: '0.00',
  value: '0.00',
};

function getByMonth(groupId: number, userId: number, year: number, month: number): Promise<ExpenseCollection> {
  const startDate = time.month(year, month);
  const endDate = startDate.clone().add(1, 'months');
  return db.transaction(async (tx: DbAccess): Promise<ExpenseCollection> => {
    await recurring.tx.createMissing(tx)(groupId, userId, endDate);
    const [expenses, startStatus, monthStatus, unconfirmedBefore] = await Promise.all([
      getBetween(tx)(groupId, userId, startDate, endDate),
      basic.tx.countTotalBetween(tx)(groupId, userId, '2000-01', startDate).then(calculateBalance),
      basic.tx.countTotalBetween(tx)(groupId, userId, startDate, endDate).then(calculateBalance),
      basic.tx.hasUnconfirmedBefore(tx)(groupId, startDate),
    ]);
    return {
      expenses,
      startStatus,
      monthStatus,
      endStatus: mapObject(zeroStatus, (v, k) => Money.from(startStatus[k]).plus(monthStatus[k]).toString()),
      unconfirmedBefore,
    };
  });
}

export interface ExpenseSearchParams {
  startDate: string;
  endDate: string;
  categoryId?: number;
}

function search(tx: DbAccess) {
  return async (groupId: number, userId: number, params: ExpenseSearchParams): Promise<UserExpense[]> => {
    debug(`Searching for ${JSON.stringify(params)}`);
    const expenses = await tx.queryList('expenses.search',
      basic.expenseSelect('WHERE group_id=$2 AND template=false AND date::DATE >= $3::DATE AND date::DATE <= $4::DATE ' +
        'AND ($5::INTEGER IS NULL OR category_id=$5::INTEGER)'),
      [userId, groupId, params.startDate, params.endDate, params.categoryId || null]);
    return expenses.map(basic.mapExpense);
  }
}

export default {
  getAll: basic.getAll,
  getByMonth: getByMonth,
  getById: basic.getById,
  getDivision: basic.getDivision,
  deleteById: basic.deleteById,
  queryReceivers: basic.queryReceivers,
  create: basic.create,
  update: basic.update,
  search: search(db),
  createRecurring: recurring.createRecurring
};
