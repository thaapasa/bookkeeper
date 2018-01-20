import Money, { MoneyLike } from '../money';
import { Session } from '../../types/session';
import { ExpenseDivisionItem, Expense } from '../../types/expense';
import { SessionWithControl } from './test-client';
import { isDbObject } from '../../types/common';
import 'jest';
import { isApiMessageWithExpenseId, ApiMessage } from '../../types/api';

let createdIds: number[] = [];

export function captureId<T>(e: T): T {
    console.log('capture', e);
    if (isDbObject(e) || isApiMessageWithExpenseId(e) || typeof e === 'number') {
        createdIds.push(isDbObject(e) ? e.id : (isApiMessageWithExpenseId(e) ? e.expenseId : e));
        console.log(e);
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
        sourceId: 1,
        categoryId: 2,
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
