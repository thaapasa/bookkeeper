import { Group, GroupProps } from '@mantine/core';
import * as React from 'react';

import { ObjectId } from 'shared/types';
import { validSessionP } from 'client/data/Login';

import { useBaconProperty } from '../hooks/useBaconState';
import { UserIdAvatar } from './UserAvatar';

type UserSelectorProps = {
  selected: ObjectId[];
  onChange?: (x: ObjectId[]) => void;
  singleSelection?: boolean;
  size?: number;
} & Omit<GroupProps, 'size' | 'onChange'>;

const UserSelectorState = validSessionP.map(s => ({ users: s.users }));

export const UserSelector: React.FC<UserSelectorProps> = ({
  onChange,
  selected,
  singleSelection,
  size,
  ...props
}) => {
  const { users } = useBaconProperty(UserSelectorState);

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
    <Group gap="xs" {...props}>
      {users.map(u => (
        <UserIdAvatar
          key={u.id}
          userId={u.id}
          variant={selected.includes(u.id) ? 'selected' : 'dimmed'}
          onClick={() => switchSelection(u.id)}
          size={size}
        >
          {u.firstName.charAt(0)}
        </UserIdAvatar>
      ))}
    </Group>
  );
};
