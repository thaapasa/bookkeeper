import { Avatar as MantineAvatar, AvatarProps } from '@mantine/core';
import * as React from 'react';

import { ObjectId, User } from 'shared/types';
import { userMapP } from 'client/data/Login';

import { classNames } from '../utils/classNames.ts';
import { connect } from './BaconConnect';
import styles from './UserAvatar.module.css';

interface UserAvatarProps extends AvatarProps {
  user: User;
  onClick?: (userId: ObjectId, e: React.MouseEvent<HTMLElement>) => void;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  size,
  className,
  onClick,
  ...props
}) => {
  if (!user?.id) return null;
  return (
    <MantineAvatar
      {...props}
      className={classNames(styles.avatar, className)}
      src={user.image}
      onClick={event => onClick?.(user.id, event)}
      size={size ?? 'md'}
      color="cyan"
    >
      {user.image ? undefined : user.firstName.charAt(0)}
    </MantineAvatar>
  );
};

interface UserIdAvatarProps extends AvatarProps {
  userId: number;
  userMap: Record<string, User>;
  onClick?: (userId: ObjectId, e: React.MouseEvent<HTMLElement>) => void;
}

const UserIdAvatar: React.FC<React.PropsWithChildren<UserIdAvatarProps>> = ({
  userMap,
  userId,
  ...props
}) => {
  const user = userMap[userId];
  return user ? <UserAvatar {...props} user={user} /> : null;
};

export default connect(userMapP.map(userMap => ({ userMap })))(UserIdAvatar);
