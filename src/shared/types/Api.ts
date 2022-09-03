export type ApiStatus = Readonly<{
  status: string;
  timestamp: string;
  version: string;
  commitId: string;
  revision: string;
  environment: string;
}>;

export type ApiMessage = Readonly<{
  status: string;
  message: string;
  userId?: number;
  expenseId?: number;
  templateExpenseId?: number;
  recurringExpenseId?: number;
  categoryId?: number;
}>;

export function isApiMessage(e: any): e is ApiMessage {
  return typeof e === 'object' && e && e.status && e.message;
}

export function isApiMessageWithExpenseId(
  e: any
): e is ApiMessage & { expenseId: number } {
  return typeof e === 'object' && e && e.status && e.message && e.expenseId;
}

export function isApiMessageWithRecurringExpenseId(
  e: any
): e is ApiMessage & { expenseId: number; recurringExpenseId: number } {
  return (
    typeof e === 'object' &&
    e.status &&
    e.message &&
    e.recurringExpenseId &&
    e.expenseId
  );
}
