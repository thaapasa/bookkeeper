import { z } from 'zod';

import { ObjectId } from './Id';

export const TrackingInfo = z.object({
  categories: z.array(ObjectId).optional(),
});
export type TrackingInfo = z.infer<typeof TrackingInfo>;

export const TrackingSubjectData = z.object({
  title: z.string(),
});
export type TrackingSubjectData = z.infer<typeof TrackingSubjectData>;

export const TrackingSubject = TrackingSubjectData.extend({
  id: ObjectId,
  trackingInfo: TrackingInfo,
  image: z.string().nonempty().optional(),
});
export type TrackingSubject = z.infer<typeof TrackingSubject>;
