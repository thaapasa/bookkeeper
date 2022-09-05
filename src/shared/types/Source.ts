import { z } from 'zod';

import { DbObject, ShortString } from './Common';
import { ObjectId } from './Id';

export const UserShare = z.object({
  userId: ObjectId,
  share: z.number(),
});
export type UserShare = z.infer<typeof UserShare>;

export const Source = DbObject.extend({
  name: ShortString,
  abbreviation: z.string().or(z.null()),
  shares: z.number(),
  users: z.array(UserShare),
  image: z.string().optional(),
});
export type Source = z.infer<typeof Source>;

export const SourcePatch = Source.pick({ name: true });
export type SourcePatch = z.infer<typeof SourcePatch>;
