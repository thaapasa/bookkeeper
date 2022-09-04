import { z } from 'zod';

import { ObjectId } from './Id';

export const CategoryInput = z.object({
  name: z.string().min(1).max(255),
  parentId: ObjectId.optional(),
});
export type CategoryInput = z.infer<typeof CategoryInput>;
