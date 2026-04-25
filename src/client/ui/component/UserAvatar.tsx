import { Avatar as MantineAvatar, AvatarProps, useComputedColorScheme } from '@mantine/core';
import * as React from 'react';

import { ObjectId, User } from 'shared/types';
import { useUserMap } from 'client/data/SessionStore';

import { classNames } from '../utils/classNames';
import styles from './UserAvatar.module.css';

interface UserAvatarProps extends AvatarProps {
  user: User;
  onClick?: (userId: ObjectId, e: React.MouseEvent<HTMLElement>) => void;
}

function pickAvatarSrc(user: User, scheme: 'light' | 'dark'): string | undefined {
  return scheme === 'dark' ? (user.imageDark ?? user.image) : (user.image ?? user.imageDark);
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  size,
  className,
  variant,
  onClick,
  ...props
}) => {
  const scheme = useComputedColorScheme('light');
  if (!user?.id) return null;
  const src = pickAvatarSrc(user, scheme);
  return (
    <MantineAvatar
      {...props}
      className={classNames(styles.avatar, variant ?? 'default', className)}
      src={src}
      onClick={event => onClick?.(user.id, event)}
      size={size ?? 'md'}
      color="cyan"
    >
      {src ? undefined : user.firstName.charAt(0)}
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
  const userMap = useUserMap()!;
  const user = userMap[userId];
  return user ? <UserAvatar {...props} user={user} /> : null;
};
