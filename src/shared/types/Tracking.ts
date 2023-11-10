import { z } from 'zod';

import { MomentInterval } from '../time/MomentInterval';
import { DateRange } from '../time/TimeRange';
import { typedKeys } from '../util/Objects';
import { ObjectId } from './Id';

export const TrackingFrequency = z.enum(['month', 'quarter', 'year']);
export type TrackingFrequency = z.infer<typeof TrackingFrequency>;

export const BaseChartType = z.enum(['line', 'bar']);
export type BaseChartType = z.infer<typeof BaseChartType>;

export const TrackingChartType = z.enum(['combined', ...typedKeys(BaseChartType.enum)]);
export type TrackingChartType = z.infer<typeof TrackingChartType>;

export const TrackingData = z
  .object({
    categories: z.array(ObjectId),
    colorOffset: z.number().int(),
    range: MomentInterval,
    frequency: TrackingFrequency,
    chartType: TrackingChartType,
    separateByUser: z.boolean(),
    includeUserTotals: z.boolean(),
  })
  .partial();
export type TrackingData = z.infer<typeof TrackingData>;

export const TrackingSubjectData = z.object({
  title: z.string(),
  trackingData: TrackingData,
});
export type TrackingSubjectData = z.infer<typeof TrackingSubjectData>;

export const TrackingSubject = TrackingSubjectData.extend({
  id: ObjectId,
  image: z.string().nonempty().optional(),
});
export type TrackingSubject = z.infer<typeof TrackingSubject>;

/**
 * Grouping key for categories. Format is
 * `c[categoryId]-[userId]`, with `userId = 0` when data is not grouped by users.
 */
type GroupingKey = `c${number}-${number}`;
export interface GroupingInfo {
  key: GroupingKey;
  label: string;
  chartType: BaseChartType;
}

export type StatisticsData = { timeSlot: string } & { [k in GroupingKey]: number };

export interface TrackingStatistics {
  groups: GroupingInfo[];
  statistics: StatisticsData[];
  range: DateRange;
}

export interface TrackingSubjectWithData extends TrackingSubject {
  data: TrackingStatistics;
}
