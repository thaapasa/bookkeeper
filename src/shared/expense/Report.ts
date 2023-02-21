import { z } from 'zod';

import { ObjectId } from 'shared/types/Id';

import { ExpenseQuery } from './Expense';

export const Report = z.object({
  id: ObjectId,
  groupId: ObjectId,
  userId: ObjectId,
  title: z.string(),
  query: ExpenseQuery,
});
export type Report = z.infer<typeof Report>;

export const ReportCreationData = Report.pick({
  title: true,
  query: true,
});
export type ReportCreationData = z.infer<typeof ReportCreationData>;
