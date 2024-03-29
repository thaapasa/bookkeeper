import { Avatar, styled } from '@mui/material';
import { cyan } from '@mui/material/colors';
import * as React from 'react';

import { User } from 'shared/types';
import { userMapE } from 'client/data/Login';

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

const StyledAvatar = styled(Avatar)`
  background-color: ${cyan[500]};
  color: ${cyan[900]};

  &.unselected {
    filter: grayscale(100%) opacity(40%);
  }
  &.selected {
    -moz-box-shadow: 0 0 4px 2px #748dac;
    -webkit-box-shadow: 0 0 4px 2px #748dac;
    box-shadow: 0 0 4px 2px #748dac;
  }
`;

export const UserAvatar: React.FC<UserAvatarProps> = ({ user, style, size, className, onClick }) =>
  user?.id ? (
    <StyledAvatar
      style={{
        ...style,
        ...(size ? { width: size, height: size } : undefined),
      }}
      className={className}
      src={user.image}
      onClick={event => onClick?.(user.id, event)}
    >
      {user.image ? undefined : user.firstName.charAt(0)}
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

export default connect(userMapE.map(userMap => ({ userMap })))(UserIdAvatar);
