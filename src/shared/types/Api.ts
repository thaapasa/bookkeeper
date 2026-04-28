import { z } from 'zod';

import type { ISOTimestamp } from '../time/Time';
import { ObjectId } from './Id';

export type ApiStatus = Readonly<{
  status: string;
  timestamp: ISOTimestamp;
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
  subscriptionId: ObjectId,
});
export type RecurringExpenseCreatedResponse = z.infer<typeof RecurringExpenseCreatedResponse>;

export function isApiMessage(e: unknown): e is ApiMessage {
  const o = e as Record<string, unknown> | null;
  return typeof e === 'object' && o !== null && !!o.status && !!o.message;
}

export function isApiMessageWithExpenseId(e: unknown): e is ExpenseIdResponse {
  const o = e as Record<string, unknown> | null;
  return typeof e === 'object' && o !== null && !!o.status && !!o.message && !!o.expenseId;
}
