import { z } from 'zod';

import { ISOMonth } from '../time/Time';
import { DateRange } from '../time/TimeRange';
import { MoneyLike } from '../util/Money';
import { ObjectId } from './Id';

export const TrackingData = z.object({
  categories: z.array(ObjectId).optional(),
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

const GroupingKey = z.string();
const GroupingInfo = z.object({ key: GroupingKey, label: z.string(), description: z.string() });

export const GroupStatistics = z.object({ key: GroupingKey, month: ISOMonth, value: MoneyLike });
export type GroupStatistics = z.infer<typeof GroupStatistics>;

export const TrackingStatistics = z.object({
  groups: z.array(GroupingInfo),
  statistics: z.record(GroupingKey, z.array(GroupStatistics)),
  range: DateRange,
});

export type TrackingStatistics = z.infer<typeof TrackingStatistics>;

export const TrackingSubjectWithData = TrackingSubject.extend({
  data: TrackingStatistics,
});
export type TrackingSubjectWithData = z.infer<typeof TrackingSubjectWithData>;
