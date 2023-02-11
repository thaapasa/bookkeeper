import { z } from 'zod';

import { ObjectId } from 'shared/types/Id';

import { ExpenseQuery } from './Expense';

export const Report = z.object({
  id: ObjectId,
  groupId: ObjectId,
  userId: ObjectId,
  title: z.string(),
  searchTerms: ExpenseQuery,
});
export type Report = z.infer<typeof Report>;

export const ReportCreationData = Report.pick({
  title: true,
  searchTerms: true,
});
