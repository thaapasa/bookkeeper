import * as React from 'react';
import Avatar from 'material-ui/Avatar';
import * as state from '../../data/State';
import { cyan500, cyan900 } from 'material-ui/styles/colors';
import { User } from '../../../shared/types/Session';
import { CSSProperties } from 'react';
import { Map } from '../../../shared/util/Util';
import { connect } from './BaconConnect';
import { userMapE } from '../../data/Login';

interface CommonAvatarProps {
  style?: CSSProperties;
  size?: number;
  className?: string;
  onClick?: (userId: number) => void;
}

interface UserAvatarProps extends CommonAvatarProps {
  user: User;
}

export function UserAvatar(props: UserAvatarProps) {
  const user = props.user;
  return user && user.id ? (
    <Avatar style={props.style}
      color={cyan900}
      size={props.size}
      backgroundColor={cyan500}
      className={'user-avatar' + (props.className ? ' ' + props.className : '')}
      src={user.image || undefined}
      onClick={x => props.onClick && props.onClick(user.id)}>{user.image ? undefined : user.firstName.charAt(0)}</Avatar>
    ) : null;
}

interface UserIdAvatarProps extends CommonAvatarProps {
  userId: number;
  userMap: Map<User>;
}

export class UserIdAvatar extends React.Component<UserIdAvatarProps, {}> {
  public render() {
    const user = this.props.userMap[this.props.userId];
    return user ? <UserAvatar {...this.props} user={user} /> : null;
  }
}

export default connect(userMapE.map(userMap => ({ userMap })))(UserIdAvatar);
