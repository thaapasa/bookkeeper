import { z } from 'zod';

export const ObjectId = z.number().int().nonnegative();
export type ObjectId = z.infer<typeof ObjectId>;
