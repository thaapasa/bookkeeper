import { z } from 'zod';

import { Email } from '../types/Email';
import { User } from '../types/Session';
import { Password } from './Password';

export const UserDataUpdate = z.object({
  firstName: z.string().trim().nonempty(),
  lastName: z.string().trim().nonempty(),
  email: Email,
  username: z.string().trim().nonempty(),
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
  currentPassword: z.string().trim().nonempty(),
  newPassword: Password,
});
export type PasswordUpdate = z.infer<typeof PasswordUpdate>;
