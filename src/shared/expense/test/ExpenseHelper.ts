import { expect } from 'bun:test';

import {
  Expense,
  ExpenseCollection,
  ExpenseDivisionItem,
  UserExpenseWithDetails,
} from '../../expense';
import { SessionWithControl } from '../../net/test';
import { uri } from '../../net/UrlUtils';
import { YearMonth } from '../../time';
import {
  ApiMessage,
  CategoryData,
  isApiMessageWithExpenseId,
  isApiMessageWithRecurringExpenseId,
  isDbObject,
  Session,
} from '../../types';
import { Money, MoneyLike } from '../../util/Money';
import { ExpenseSplit } from '../ExpenseSplit';

let createdIds: number[] = [];
let createdRecurrences: number[] = [];
const createdCategories: number[] = [];

export function findSourceId(name: string, session: Session): number {
  const user = session.sources.find(u => u.name === name);
  if (!user) {
    throw new Error('Source not found');
  }
  return user.id;
}

export function findCategoryId(name: string, session: Session): number {
  const c = session.categories.find(s => s.name === name);
  if (!c) {
    throw new Error('Category not found');
  }
  return c.id;
}

export function findUserId(name: string, session: Session): number {
  const user = session.users.find(u => u.username === name);
  if (!user) {
    throw new Error('User not found');
  }
  return user.id;
}

export function captureId<T>(e: T): T {
  if (isDbObject(e)) {
    if ((e as any).recurringExpenseId) {
      createdRecurrences.push(e.id);
    } else {
      createdIds.push(e.id);
    }
  } else if (isApiMessageWithRecurringExpenseId(e)) {
    createdRecurrences.push(e.expenseId);
  } else if (isApiMessageWithExpenseId(e)) {
    createdIds.push(e.expenseId);
  } else if (typeof e === 'number') {
    createdIds.push(e);
  }
  return e;
}

export const division = {
  iPayShared: (session: Session, sum: MoneyLike): ExpenseDivisionItem[] => {
    const msum = Money.from(sum);
    return [
      { type: 'cost', userId: session.user.id, sum: msum.negate().toString() },
      { type: 'benefit', userId: 1, sum: msum.divide(2).toString() },
      { type: 'benefit', userId: 2, sum: msum.divide(2).toString() },
    ];
  },
  iPayMyOwn: (session: Session, sum: MoneyLike): ExpenseDivisionItem[] => {
    const msum = Money.from(sum);
    return [
      { type: 'cost', userId: session.user.id, sum: msum.negate().toString() },
      { type: 'benefit', userId: session.user.id, sum: msum.toString() },
    ];
  },
};

export async function newExpense(
  session: SessionWithControl,
  expense?: Partial<Expense>,
): Promise<ApiMessage> {
  const data = {
    userId: session.user.id,
    date: '2018-01-22',
    receiver: 'S-market',
    type: 'expense',
    sum: '10.51',
    title: 'Karkkia ja porkkanaa',
    sourceId: findSourceId('Yhteinen tili', session),
    categoryId: findCategoryId('Ruoka', session),
    ...expense,
  };
  return captureId(await session.post<ApiMessage>('/api/expense', data));
}

export async function fetchMonthStatus(session: SessionWithControl, month: YearMonth) {
  return session.get<ExpenseCollection>(`/api/expense/month`, month);
}

export async function fetchExpense(
  session: SessionWithControl,
  expenseId: number,
): Promise<UserExpenseWithDetails> {
  return await session.get<UserExpenseWithDetails>(uri`/api/expense/${expenseId}`);
}

export async function splitExpense(
  session: SessionWithControl,
  expenseId: number,
  splits: ExpenseSplit[],
): Promise<ApiMessage> {
  return await session.post<ApiMessage>(uri`/api/expense/${expenseId}/split`, {
    splits,
  });
}

export async function newCategory(
  session: SessionWithControl,
  data: CategoryData,
): Promise<ApiMessage> {
  const d = await session.post<ApiMessage>('/api/category', data);
  if (d.categoryId) {
    createdCategories.push(d.categoryId);
  }
  return d;
}

export async function deleteCreated(session: SessionWithControl): Promise<boolean> {
  if (!session) {
    return false;
  }
  try {
    for (const id of createdRecurrences) {
      await session.del(uri`/api/expense/recurring/${id}?target=all`);
    }
    for (const id of createdIds) {
      await session.del(uri`/api/expense/${id}`);
    }
    const revCats = createdCategories.reverse();
    for (const id of revCats) {
      await session.del(uri`/api/category/${id}`);
    }
    return true;
  } finally {
    // Clear captured ids array
    createdIds = [];
    createdRecurrences = [];
  }
}

export function checkCreateStatus(s: ApiMessage): number {
  expect(s.status).toEqual('OK');
  expect(s.expenseId).toBeGreaterThan(0);
  if (!s.expenseId) {
    throw new Error('not-reached');
  }
  return s.expenseId;
}

export async function cleanup(session: SessionWithControl) {
  try {
    await deleteCreated(session);
    await session.logout();
  } catch (e) {
    // Ignore
  }
}
