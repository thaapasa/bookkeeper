import { z } from 'zod';

import { ISOMonthZ } from 'shared/util/Time';
import { DateRangeZ } from 'shared/util/TimeRange';

export const StatisticsSearchType = z.object({
  categoryIds: z.array(z.number()),
});
export type StatisticsSearchType = z.infer<typeof StatisticsSearchType>;

export const CategoryStatisticsData = z.object({
  sum: z.string(),
  month: ISOMonthZ,
  categoryId: z.number(),
});
export type CategoryStatisticsData = z.infer<typeof CategoryStatisticsData>;

export const CategoryStatistics = StatisticsSearchType.extend({
  statistics: z.record(z.string(), z.array(CategoryStatisticsData)),
  range: DateRangeZ,
});
export type CategoryStatistics = z.infer<typeof CategoryStatistics>;
