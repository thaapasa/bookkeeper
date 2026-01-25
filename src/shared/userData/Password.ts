import { z } from 'zod';

export const Password = z
  .string()
  .trim()
  .min(1, { error: 'Salasana ei saa olla tyhjä' })
  .min(8, { error: 'Salasanassa täytyy olla vähintään 8 merkkiä' });
export type Password = z.infer<typeof Password>;

export function isPassword(p: unknown): p is Password {
  const res = Password.safeParse(p);
  return res.success;
}
