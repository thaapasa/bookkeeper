import * as React from 'react';
import Avatar from 'material-ui/Avatar';
import { cyan500, cyan900 } from 'material-ui/styles/colors';
import { User } from '../../../shared/types/Session';
import { connect } from './BaconConnect';
import { userMapE } from '../../data/Login';
import styled from 'styled-components';

interface CommonAvatarProps {
  style?: React.CSSProperties;
  size?: number;
  className?: string;
  onClick?: (userId: number) => void;
}

interface UserAvatarProps extends CommonAvatarProps {
  user: User;
}

const StyledAvatar = styled(Avatar)`
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
  return user && user.id ? (
    <StyledAvatar
      style={props.style}
      color={cyan900}
      size={props.size}
      backgroundColor={cyan500}
      className={props.className}
      src={user.image || undefined}
      onClick={() => props.onClick && props.onClick(user.id)}
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
