import { z } from 'zod';

import { ObjectId } from './Id';

export const ExpenseGroupingData = z.object({
  title: z.string(),
  categories: z.array(ObjectId),
});
export type ExpenseGroupingData = z.infer<typeof ExpenseGroupingData>;

export const ExpenseGrouping = ExpenseGroupingData.extend({
  id: ObjectId,
  image: z.string().nonempty().optional(),
});
export type ExpenseGrouping = z.infer<typeof ExpenseGrouping>;
