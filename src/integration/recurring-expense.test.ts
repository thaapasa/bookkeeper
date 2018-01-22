import 'jest';
import * as help from '../shared/util/test/expense-helper';
import * as client from '../shared/util/test/test-client';
import { SessionWithControl } from '../shared/util/test/test-client';
import { ExpenseCollection, ExpenseStatus, Expense, UserExpense } from '../shared/types/expense';
import Money, { MoneyLike } from '../shared/util/money';
import { checkCreateStatus } from '../shared/util/test/expense-helper';
import { ApiMessage } from '../shared/types/api';

describe('recurringExpense', () => {

    let session: SessionWithControl;

    const newExpense = help.newExpense;

    beforeEach(async () => { session = await client.getSession('sale', 'salasana'); });
    afterEach(async () => { await help.cleanup(session); });

    async function checkMonthStatus(expectedBenefit?: MoneyLike, expectItems?: (items: UserExpense[]) => any): Promise<Money> {
        const m = await session.get<ExpenseCollection>(`/api/expense/month`, { year: 2017, month: 1 });
        expect(m).toHaveProperty('monthStatus');
        expect(m.monthStatus).toHaveProperty('benefit');
        if (expectedBenefit) {
            expect(m.monthStatus.benefit).toEqual(expectedBenefit);
        }
        expect(m).toHaveProperty('expenses');
        expect(m.expenses).toBeInstanceOf(Array);
        if (expectItems) {
            expectItems(m.expenses);
        }
        return Money.from(m.monthStatus.benefit);
    }

    it('recurring expense template should not show up on expense queries', async () => {
        const monthBenefit1 = await checkMonthStatus();
        const expenseId = checkCreateStatus(await newExpense(session, {
            sum: '150.00', confirmed: false, date: '2017-01-15', title: 'Tonnikalaa' }));

        const e = await session.get<Expense>(`/api/expense/${expenseId}`);
        expect(e).toHaveProperty('division');
        expect(e.division).toContainEqual({ userId: 2, type: 'benefit', sum: '75.00' });
        expect(e).toHaveProperty('recurringExpenseId');
        expect(e.recurringExpenseId).toBeNull;

        const monthBenefit2 = await checkMonthStatus(monthBenefit1.plus('75').toString(),
                e => expect(e.find(i => i.id === expenseId)).toBeTruthy);
        const s = await session.put<ApiMessage>(`/api/expense/recurring/${expenseId}`, { period: 'monthly' });
        expect(s.recurringExpenseId).toBeGreaterThan(0);
        expect(s.templateExpenseId).toBeGreaterThan(0);
        help.captureId(s.templateExpenseId);
        checkMonthStatus(monthBenefit2.toString());

        const e2 = await session.get<Expense>(`/api/expense/${expenseId}`);
        expect(e2.recurringExpenseId).toEqual(s.recurringExpenseId);
    });

});
