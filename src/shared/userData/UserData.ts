import { z } from 'zod';

import { Email } from '../types/Email';
import { User } from '../types/Session';
import { Password } from './Password';

export const UserDataUpdate = z.object({
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  email: Email,
  username: z.string().trim().min(1),
});
export type UserDataUpdate = z.infer<typeof UserDataUpdate>;

export function toUserData(user: User): UserDataUpdate {
  return {
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    username: user.username,
  };
}

export const PasswordUpdate = z.object({
  currentPassword: z.string().trim().min(1),
  newPassword: Password,
});
export type PasswordUpdate = z.infer<typeof PasswordUpdate>;
