import { z } from 'zod';

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
