import styled from '@emotion/styled';
import { Avatar as MantineAvatar } from '@mantine/core';
import * as React from 'react';

import { User } from 'shared/types';
import { userMapP } from 'client/data/Login';

import { connect } from './BaconConnect';

interface CommonAvatarProps {
  style?: React.CSSProperties;
  size?: number;
  className?: string;
  onClick?: (userId: number, event: React.MouseEvent<HTMLDivElement>) => void;
}

interface UserAvatarProps extends CommonAvatarProps {
  user: User;
}

const StyledAvatar = styled.div`
  &.unselected {
    filter: grayscale(100%) opacity(40%);
  }
  &.selected {
    box-shadow: 0 0 4px 2px var(--mantine-color-primary-4);
  }
`;

export const UserAvatar: React.FC<UserAvatarProps> = ({ user, style, size, className, onClick }) =>
  user?.id ? (
    <StyledAvatar
      className={className}
      style={style}
      onClick={event => onClick?.(user.id, event)}
    >
      <MantineAvatar
        src={user.image}
        size={size ?? 'md'}
        color="cyan"
      >
        {user.image ? undefined : user.firstName.charAt(0)}
      </MantineAvatar>
    </StyledAvatar>
  ) : null;

interface UserIdAvatarProps extends CommonAvatarProps {
  userId: number;
  userMap: Record<string, User>;
}

export const UserIdAvatar: React.FC<React.PropsWithChildren<UserIdAvatarProps>> = ({
  userMap,
  userId,
  ...props
}) => {
  const user = userMap[userId];
  return user ? <UserAvatar {...props} user={user} /> : null;
};

export default connect(userMapP.map(userMap => ({ userMap })))(UserIdAvatar);
