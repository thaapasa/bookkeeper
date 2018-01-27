import Money from '../../../shared/util/money';
import { Expense } from '../../../shared/types/expense';

export function expenseName(e: Expense): string {
    return `${e.title} (${e.receiver}): ${Money.from(e.sum).format()}`;
}
