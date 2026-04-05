import { ActionIcon } from '@mantine/core';
import * as React from 'react';

import { Category } from 'shared/types';

import { Icon, Icons } from '../icons/Icons';

export const AddCategoryButton: React.FC<{
  onAdd: (p?: Category) => void;
  parent?: Category;
  color?: string;
  icon?: Icon;
}> = ({ onAdd, parent, color, icon }) => {
  const I = Icons[icon ?? 'Add'];
  return (
    <ActionIcon title="Lisää" color={color} onClick={() => onAdd(parent)}>
      <I />
    </ActionIcon>
  );
};

export const EditCategoryButton: React.FC<{
  onEdit: (p: Category) => void;
  category: Category;
  color?: string;
}> = ({ onEdit, category, color }) => (
  <ActionIcon title="Muokkaa" color={color} onClick={() => onEdit(category)}>
    <Icons.Edit />
  </ActionIcon>
);

export const ToggleButton: React.FC<{
  state: boolean;
  onToggle: () => void;
  color?: string;
}> = ({ state, onToggle, color }) => (
  <ActionIcon title={state ? 'Sulje' : 'Avaa'} color={color} onClick={onToggle}>
    {state ? <Icons.ExpandLess /> : <Icons.ExpandMore />}
  </ActionIcon>
);
