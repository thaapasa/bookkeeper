import { z } from 'zod';

import { Email } from './Email';
import { User } from './Session';

export const UserDataUpdate = z.object({
  firstName: z.string().trim().nonempty(),
  lastName: z.string().trim().nonempty(),
  email: Email,
});
export type UserDataUpdate = z.infer<typeof UserDataUpdate>;

export function toUserData(user: User): UserDataUpdate {
  return {
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
  };
}
