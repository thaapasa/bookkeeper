import { z } from 'zod';

import { MomentInterval } from '../time/MomentInterval';
import { DateRange } from '../time/TimeRange';
import { ObjectId } from './Id';

export const TrackingFrequency = z.enum(['month', 'year']);
export type TrackingFrequency = z.infer<typeof TrackingFrequency>;

export const TrackingData = z.object({
  categories: z.array(ObjectId).optional(),
  colorOffset: z.number().int().optional(),
  range: MomentInterval.optional(),
  frequency: TrackingFrequency.optional(),
});
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

type GroupingKey = `c${number}`;
export interface GroupingInfo {
  key: GroupingKey;
  label: string;
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
