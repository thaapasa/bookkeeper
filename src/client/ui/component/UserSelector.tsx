import * as React from 'react';
import UserAvatar from './UserAvatar';
import { User } from 'shared/types/Session';
import { connect } from './BaconConnect';
import { validSessionE } from '../../data/Login';
import styled from 'styled-components';

const Container = styled.div`
  display: inline-flex;
  flex-direction: row;
`;

const StyledUserAvatar = styled(UserAvatar)`
  margin: 0.2em;
  vertical-align: top;
`;

interface UserSelectorProps {
  selected: number[];
  onChange?: (x: number[]) => void;
  style?: React.CSSProperties;
  users: User[];
}

export class UserSelector extends React.Component<UserSelectorProps> {
  private switchSelection = (id: number) => {
    const oldS = this.props.selected;
    const foundAt = oldS.indexOf(id);
    const newS =
      foundAt >= 0 ? oldS.slice().filter(i => i !== id) : oldS.slice();
    if (foundAt < 0) {
      newS.push(id);
    }
    newS.sort();
    if (this.props.onChange) {
      this.props.onChange(newS);
    }
  };

  public render() {
    return (
      <Container style={this.props.style}>
        {this.props.users.map(u => (
          <StyledUserAvatar
            key={u.id}
            userId={u.id}
            className={
              this.props.selected.includes(u.id) ? 'selected' : 'unselected'
            }
            onClick={() => this.switchSelection(u.id)}
          >
            {u.firstName.charAt(0)}
          </StyledUserAvatar>
        ))}
      </Container>
    );
  }
}

export default connect(validSessionE.map(s => ({ users: s.users })))(
  UserSelector
);
