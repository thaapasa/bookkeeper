import { z } from 'zod';

export const EmailRegExp = /^[A-Z0-9+_.-]+@[A-Z0-9.-]+$/i;
export const Email = z.string().trim().regex(EmailRegExp);
export type Email = z.infer<typeof Email>;

export const StrictEmail = z.string().regex(EmailRegExp);

export function isEmail(s: string): s is Email {
  const v = StrictEmail.safeParse(s);
  return v.success;
}
