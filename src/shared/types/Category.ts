import { z } from 'zod';

import { ShortString } from './Common';
import { ObjectId } from './Id';

export const CategoryInput = z.object({
  name: ShortString,
  parentId: ObjectId.optional(),
});
export type CategoryInput = z.infer<typeof CategoryInput>;
