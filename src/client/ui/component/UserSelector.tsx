import { styled } from '@mui/material';
import * as React from 'react';

import { ObjectId, User } from 'shared/types';
import { validSessionE } from 'client/data/Login';

import { connect } from './BaconConnect';
import UserAvatar from './UserAvatar';
import { styled } from '@mui/material';

const Container = styled('div')`
  display: inline-flex;
  flex-direction: row;
`;

const StyledUserAvatar = styled(UserAvatar)`
  margin: 0.2em;
  vertical-align: top;
`;

interface UserSelectorProps {
  selected: ObjectId[];
  onChange?: (x: ObjectId[]) => void;
  style?: React.CSSProperties;
  users: User[];
  singleSelection?: boolean;
  size?: number;
}

export const UserSelector: React.FC<UserSelectorProps> = ({
  onChange,
  selected,
  style,
  users,
  singleSelection,
  size,
}) => {
  const switchSelection = (id: ObjectId) => {
    if (singleSelection) {
      onChange?.([id]);
      return;
    }
    const oldS = selected;
    const foundAt = oldS.indexOf(id);
    const newS = foundAt >= 0 ? oldS.slice().filter(i => i !== id) : oldS.slice();
    if (foundAt < 0) {
      newS.push(id);
    }
    newS.sort();
    onChange?.(newS);
  };

  return (
    <Container style={style}>
      {users.map(u => (
        <StyledUserAvatar
          key={u.id}
          userId={u.id}
          className={selected.includes(u.id) ? 'selected' : 'unselected'}
          onClick={() => switchSelection(u.id)}
          size={size}
        >
          {u.firstName.charAt(0)}
        </StyledUserAvatar>
      ))}
    </Container>
  );
};

export default connect(validSessionE.map(s => ({ users: s.users })))(UserSelector);
