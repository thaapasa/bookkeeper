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
  userId: ObjectId.optional(),
  expenseId: ObjectId.optional(),
  templateExpenseId: ObjectId.optional(),
  recurringExpenseId: ObjectId.optional(),
  categoryId: ObjectId.optional(),
  count: z.number().int().optional(),
});

export type ApiMessage = z.infer<typeof ApiMessage>;

export function isApiMessage(e: any): e is ApiMessage {
  return typeof e === 'object' && e && e.status && e.message;
}

export function isApiMessageWithExpenseId(e: any): e is ApiMessage & { expenseId: number } {
  return typeof e === 'object' && e && e.status && e.message && e.expenseId;
}

export function isApiMessageWithRecurringExpenseId(
  e: any,
): e is ApiMessage & { expenseId: number; recurringExpenseId: number } {
  return typeof e === 'object' && e.status && e.message && e.recurringExpenseId && e.expenseId;
}
