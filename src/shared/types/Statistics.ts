import { z } from 'zod';

import { DateRange, ISOMonth } from '../time';
import { ObjectId } from './Id';

export const CategorySelection = z.object({
  id: ObjectId,
  grouped: z.boolean().optional(),
});

export type CategorySelection = z.infer<typeof CategorySelection>;

export const StatisticsSearchType = z.object({
  categoryIds: z.array(CategorySelection),
  onlyOwn: z.boolean().optional(),
  /** Both start and end dates are included in search */
  range: DateRange.optional(),
});
export type StatisticsSearchType = z.infer<typeof StatisticsSearchType>;

export const CategoryStatisticsData = z.object({
  sum: z.string(),
  month: ISOMonth,
  categoryId: z.number(),
});
export type CategoryStatisticsData = z.infer<typeof CategoryStatisticsData>;

export const YearlySummaryRow = z.object({
  /** Calendar year, e.g. 2026 */
  year: z.number().int(),
  /** Top-level category id (sub-categories are rolled up to their parent) */
  categoryId: z.number(),
  type: z.enum(['expense', 'income']),
  sum: z.string(),
});
export type YearlySummaryRow = z.infer<typeof YearlySummaryRow>;

export const YearlySummary = z.object({
  /** Both start and end dates are included */
  range: DateRange,
  rows: z.array(YearlySummaryRow),
});
export type YearlySummary = z.infer<typeof YearlySummary>;

export const CategoryStatistics = StatisticsSearchType.extend({
  /**
   * Category statistics data, keyed by the category id (as string)
   */
  statistics: z.record(z.string(), z.array(CategoryStatisticsData)),
  range: DateRange,
});
export type CategoryStatistics = z.infer<typeof CategoryStatistics>;
