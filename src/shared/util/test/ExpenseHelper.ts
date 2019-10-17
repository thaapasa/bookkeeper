import 'jest';
import Money, { MoneyLike } from '../Money';
import { Session, CategoryData } from '../../types/Session';
import { ExpenseDivisionItem, Expense } from '../../types/Expense';
import { SessionWithControl } from './TestClient';
import { isDbObject } from '../../types/Common';
import {
  isApiMessageWithExpenseId,
  ApiMessage,
  isApiMessageWithRecurringExpenseId,
} from '../../types/Api';

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
  expense?: Partial<Expense>
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
  return captureId(await session.put<ApiMessage>('/api/expense', data));
}

export async function newCategory(
  session: SessionWithControl,
  data: CategoryData
): Promise<ApiMessage> {
  const d = await session.put<ApiMessage>('/api/category', data);
  if (d.categoryId) {
    createdCategories.push(d.categoryId);
  }
  return d;
}

export async function deleteCreated(
  session: SessionWithControl
): Promise<boolean> {
  if (!session) {
    return false;
  }
  try {
    for (const id of createdRecurrences) {
      await session.del(`/api/expense/recurring/${id}?target=all`);
    }
    for (const id of createdIds) {
      await session.del(`/api/expense/${id}`);
    }
    const revCats = createdCategories.reverse();
    for (const id of revCats) {
      await session.del(`/api/category/${id}`);
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
