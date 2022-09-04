import { z } from 'zod';

import { IntString } from './Validator';

export const ObjectId = z.number().int().nonnegative();
export type ObjectId = z.infer<typeof ObjectId>;

export const ObjectIdString = IntString.refine(i => i >= 0);
export type ObjectIdString = z.infer<typeof ObjectIdString>;
