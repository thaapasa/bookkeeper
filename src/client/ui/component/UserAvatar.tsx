import * as React from 'react';
import { User } from '../../../shared/types/Session';
import { connect } from './BaconConnect';
import { userMapE } from '../../data/Login';
import styled from 'styled-components';
import { Avatar } from '@material-ui/core';
import { cyan } from '@material-ui/core/colors';

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

export function UserAvatar(props: UserAvatarProps) {
  const user = props.user;
  const style = props.style || {};
  if (props.size) {
    style.width = props.size;
    style.height = props.size;
  }
  return user && user.id ? (
    <StyledAvatar
      style={style}
      className={props.className}
      src={user.image || undefined}
      onClick={(event: React.MouseEvent<HTMLDivElement>) =>
        props.onClick && props.onClick(user.id, event)
      }
    >
      {user.image ? undefined : user.firstName.charAt(0)}
    </StyledAvatar>
  ) : null;
}

interface UserIdAvatarProps extends CommonAvatarProps {
  userId: number;
  userMap: Record<string, User>;
}

export class UserIdAvatar extends React.Component<UserIdAvatarProps, {}> {
  public render() {
    const user = this.props.userMap[this.props.userId];
    return user ? <UserAvatar {...this.props} user={user} /> : null;
  }
}

export default connect(userMapE.map(userMap => ({ userMap })))(UserIdAvatar);
