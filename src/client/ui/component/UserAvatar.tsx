import { Avatar as MantineAvatar, AvatarProps } from '@mantine/core';
import * as React from 'react';

import { ObjectId, User } from 'shared/types';
import { userMapP } from 'client/data/Login';

import { useBaconState } from '../hooks/useBaconState';
import { classNames } from '../utils/classNames';
import styles from './UserAvatar.module.css';

interface UserAvatarProps extends AvatarProps {
  user: User;
  onClick?: (userId: ObjectId, e: React.MouseEvent<HTMLElement>) => void;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  size,
  className,
  variant,
  onClick,
  ...props
}) => {
  if (!user?.id) return null;
  return (
    <MantineAvatar
      {...props}
      className={classNames(styles.avatar, variant ?? 'default', className)}
      src={user.image}
      onClick={event => onClick?.(user.id, event)}
      size={size ?? 'md'}
      color="cyan"
    >
      {user.image ? undefined : user.firstName.charAt(0)}
    </MantineAvatar>
  );
};

interface UserIdAvatarProps extends Omit<AvatarProps, 'variant'> {
  userId: number;
  variant?: 'default' | 'selected' | 'dimmed';
  onClick?: (userId: ObjectId, e: React.MouseEvent<HTMLElement>) => void;
}

export const UserIdAvatar: React.FC<React.PropsWithChildren<UserIdAvatarProps>> = ({
  userId,
  ...props
}) => {
  const userMap = useBaconState(userMapP);
  const user = userMap?.[userId];
  return user ? <UserAvatar {...props} user={user} /> : null;
};
