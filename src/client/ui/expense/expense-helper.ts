import Money, { MoneyLike } from '../../../shared/util/money';
import { Expense } from '../../../shared/types/expense';

export function expenseName(e: Expense): string {
    return `${e.title} (${e.receiver}): ${Money.from(e.sum).format()}`;
}

export function money(v?: MoneyLike): string {
    return v ? Money.from(v).format() : '-';
}

export interface ExpenseTotals {
    totalExpense: MoneyLike;
    totalIncome: MoneyLike;
}

export interface ExpenseFilter {
    filter: (expense: Expense) => boolean;
    name: string;
    avatar: any;
}
