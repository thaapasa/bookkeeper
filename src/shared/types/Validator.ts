import { z } from 'zod';

export const BooleanStringZ = z
  .enum(['true', 'false'])
  .transform(s => s === 'true');

export const IntStringZ = z
  .string()
  .refine(s => {
    try {
      const n = Number(s);
      return !isNaN(n);
    } catch (e) {
      return false;
    }
  })
  .transform(n => Number(n));

const intArrayStringRE = /^\[([0-9]+(, ?[0-9]+)*)?\]$/;

export const IntArrayStringZ = z
  .string()
  .regex(intArrayStringRE)
  .transform((r): number[] => JSON.parse(r));
