import { z } from 'zod';

import { MomentInterval } from '../time/MomentInterval';
import { ISOMonth } from '../time/Time';
import { DateRange } from '../time/TimeRange';
import { ObjectId } from './Id';

export const TrackingData = z.object({
  categories: z.array(ObjectId).optional(),
  colorOffset: z.number().int().optional(),
  range: MomentInterval.optional(),
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

export type StatisticsData = { month: ISOMonth } & { [k in GroupingKey]: number };

export interface TrackingStatistics {
  groups: GroupingInfo[];
  statistics: StatisticsData[];
  range: DateRange;
}

export interface TrackingSubjectWithData extends TrackingSubject {
  data: TrackingStatistics;
}
