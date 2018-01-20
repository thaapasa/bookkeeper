export interface ApiMessage {
    status: string;
    message: string;
    userId?: number;
    expenseId?: number;
}

export function isApiMessage(e: any): e is ApiMessage {
    return typeof e === 'object' && e.status && e.message;
}

export function isApiMessageWithExpenseId(e: any): e is ApiMessage & { expenseId: number } {
    return typeof e === 'object' && e.status && e.message && e.expenseId;
}
