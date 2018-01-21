import Money, { MoneyLike } from '../money';
import { Session, Category, Source } from '../../types/session';
import { ExpenseDivisionItem, Expense } from '../../types/expense';
import { SessionWithControl } from './test-client';
import { isDbObject } from '../../types/common';
import 'jest';
import { isApiMessageWithExpenseId, ApiMessage } from '../../types/api';

let createdIds: number[] = [];

export function captureId<T>(e: T): T {
    if (isDbObject(e) || isApiMessageWithExpenseId(e) || typeof e === 'number') {
        createdIds.push(isDbObject(e) ? e.id : (isApiMessageWithExpenseId(e) ? e.expenseId : e));
    }
    return e;
};

export const division = {
    iPayShared: function (session: Session, sum: MoneyLike): ExpenseDivisionItem[] {
        const msum = Money.from(sum);
        return [
            { type: 'cost', userId: session.user.id, sum: msum.negate().toString() },
            { type: 'benefit', userId: 1, sum: msum.divide(2).toString() },
            { type: 'benefit', userId: 2, sum: msum.divide(2).toString() }
        ];
    },
    iPayMyOwn: function (session: Session, sum: MoneyLike): ExpenseDivisionItem[] {
        const msum = Money.from(sum);
        return [
            { type: 'cost', userId: session.user.id, sum: msum.negate().toString() },
            { type: 'benefit', userId: session.user.id, sum: msum.toString() }
        ];
    }
};

export async function newExpense(session: SessionWithControl, expense?: Partial<Expense>): Promise<ApiMessage> {
    const data = {
        userId: session.user.id,
        date: '2018-01-22',
        receiver: 'S-market',
        type: 'expense',
        sum: '10.51',
        title: 'Karkkia ja porkkanaa',
        sourceId: findSourceId('Yhteinen tili', session),
        categoryId: findCategoryId('Ruoka', session),
        ...expense
    };
    return captureId(await session.put<ApiMessage>('/api/expense', data));
};

export async function deleteCreated(session: SessionWithControl): Promise<boolean> {
    if (!session) { return false; }
    await Promise.all(createdIds.map(id => session.del(`/api/expense/${id}`)));
    // Clear createdIds array
    createdIds = [];
    return true;
};

export function checkCreateStatus(s: ApiMessage) {
    expect(s.status).toEqual('OK');
    expect(s.expenseId).toBeGreaterThan(0);
    return s.expenseId;
};

export function findSourceId(name: string, session: Session): number {
    const s = session.sources.find(s => s.name === name);
    if (!s) { throw new Error('Source not found'); }
    return s.id;
}

export function findCategoryId(name: string, session: Session): number {
    const c = session.categories.find(s => s.name === name);
    if (!c) { throw new Error('Category not found'); }
    return c.id;
}

export function findUserId(name: string, session: Session): number {
    const s = session.users.find(s => s.username === name);
    if (!s) { throw new Error('User not found'); }
    return s.id;
}
