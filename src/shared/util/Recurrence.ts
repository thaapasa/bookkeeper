import { z } from 'zod';

export const RecurrenceUnit = z.enum([
  'days',
  'weeks',
  'months',
  'years',
  'quarters',
]);
export type RecurrenceUnit = z.infer<typeof RecurrenceUnit>;

export const RecurrencePeriod = z.object({
  amount: z.number().int().min(1),
  unit: RecurrenceUnit,
});
export type RecurrencePeriod = z.infer<typeof RecurrencePeriod>;
