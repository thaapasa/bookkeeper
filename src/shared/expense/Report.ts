import { z } from 'zod';

import { ISODate } from 'shared/time/Time';
import { ObjectId } from 'shared/types/Id';
import { MoneyLike } from 'shared/util/Money';

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

export const ExpenseReport = z.object({
  id: z.string(),
  type: z.literal('report'),
  title: z.string(),
  sum: MoneyLike,
  categoryId: ObjectId,
  firstDate: ISODate,
  lastDate: ISODate,
  minExpenseTitle: z.string(),
  maxExpenseTitle: z.string(),
  recurrencePerYear: MoneyLike,
  recurrencePerMonth: MoneyLike,
});
export type ExpenseReport = z.infer<typeof ExpenseReport>;
