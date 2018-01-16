import Money from '../../shared/util/money';

export function expenseName(e: any): string {
    return `${e.title} (${e.receiver}): ${Money.from(e.sum).format()}`;
}
