import { z } from 'zod';

import { ISOMonth } from 'shared/util/Time';
import { DateRange } from 'shared/util/TimeRange';

export const StatisticsSearchType = z.object({
  categoryIds: z.array(z.number()),
  onlyOwn: z.boolean().optional(),
});
export type StatisticsSearchType = z.infer<typeof StatisticsSearchType>;

export const CategoryStatisticsData = z.object({
  sum: z.string(),
  month: ISOMonth,
  categoryId: z.number(),
});
export type CategoryStatisticsData = z.infer<typeof CategoryStatisticsData>;

export const CategoryStatistics = StatisticsSearchType.extend({
  statistics: z.record(z.string(), z.array(CategoryStatisticsData)),
  range: DateRange,
});
export type CategoryStatistics = z.infer<typeof CategoryStatistics>;
