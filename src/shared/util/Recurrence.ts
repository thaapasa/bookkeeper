import { z } from 'zod';

export const RecurrenceUnit = z.enum([
  'days',
  'weeks',
  'months',
  'years',
  'quarters',
]);
export type RecurrenceUnit = z.infer<typeof RecurrenceUnit>;
