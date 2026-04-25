import { z } from 'zod';

import { ObjectId } from '../types/Id';
import { ExpenseQuery } from './Expense';

export const ReportDef = z.object({
  id: ObjectId,
  groupId: ObjectId,
  userId: ObjectId,
  title: z.string(),
  query: ExpenseQuery,
});
export type ReportDef = z.infer<typeof ReportDef>;

export const ReportCreationData = ReportDef.pick({
  title: true,
  query: true,
});
export type ReportCreationData = z.infer<typeof ReportCreationData>;
