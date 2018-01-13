import Money from '../../shared/util/money';

export interface Expense {
    id: number;
    userId: number;
    title: string;
    sum: string;
    sourceId: number;
    categoryId: number;
    description?: string;
};

export function expenseName(e: any): string {
    return `${e.title} (${e.receiver}): ${Money.from(e.sum).format()}`;
}
