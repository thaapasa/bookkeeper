import { z } from 'zod';

import { ObjectId } from './Id';

export type ApiStatus = Readonly<{
  status: string;
  timestamp: string;
  version: string;
  runtimeVersion: string;
  commitId: string;
  revision: string;
  environment: string;
}>;

export const ApiMessage = z.object({
  status: z.string(),
  message: z.string(),
});
export type ApiMessage = z.infer<typeof ApiMessage>;

export const ExpenseIdResponse = ApiMessage.extend({ expenseId: ObjectId });
export type ExpenseIdResponse = z.infer<typeof ExpenseIdResponse>;

export const CategoryIdResponse = ApiMessage.extend({ categoryId: ObjectId });
export type CategoryIdResponse = z.infer<typeof CategoryIdResponse>;

export const UserIdResponse = ApiMessage.extend({ userId: ObjectId });
export type UserIdResponse = z.infer<typeof UserIdResponse>;

export const CountResponse = ApiMessage.extend({ count: z.number().int() });
export type CountResponse = z.infer<typeof CountResponse>;

export const RecurringExpenseCreatedResponse = ApiMessage.extend({
  expenseId: ObjectId,
  templateExpenseId: ObjectId,
  recurringExpenseId: ObjectId,
});
export type RecurringExpenseCreatedResponse = z.infer<typeof RecurringExpenseCreatedResponse>;

export function isApiMessage(e: any): e is ApiMessage {
  return typeof e === 'object' && e && e.status && e.message;
}

export function isApiMessageWithExpenseId(e: any): e is ExpenseIdResponse {
  return typeof e === 'object' && e && e.status && e.message && e.expenseId;
}

export function isApiMessageWithRecurringExpenseId(e: any): e is RecurringExpenseCreatedResponse {
  return typeof e === 'object' && e.status && e.message && e.recurringExpenseId && e.expenseId;
}
