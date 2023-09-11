import { z } from 'zod';

export const BooleanString = z.enum(['true', 'false']).transform(s => s === 'true');

export const IntString = z
  .string()
  .refine(s => {
    try {
      const n = Number(s);
      return !isNaN(n) && Math.round(n) === n;
    } catch (e) {
      return false;
    }
  })
  .transform(n => Number(n));

const intArrayStringRE = /^\[([0-9]+(, ?[0-9]+)*)?\]$/;

export const IntArrayString = z
  .string()
  .regex(intArrayStringRE)
  .transform((r): number[] => JSON.parse(r));

export const IntOrString = z.number().int().or(IntString);

export const JSONString = <Output>(codec: z.ZodType<Output, any, any>): z.ZodType<Output, any, string> =>
  z
    .string()
    .transform(s => JSON.parse(s))
    .transform(s => codec.parse(s));
