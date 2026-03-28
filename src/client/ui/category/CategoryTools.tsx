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
  const Icon = Icons[icon ?? 'Add'];
  return (
    <ActionIcon title="Lisää" onClick={() => onAdd(parent)}>
      <Icon color={color} />
    </ActionIcon>
  );
};

export const EditCategoryButton: React.FC<{
  onEdit: (p: Category) => void;
  category: Category;
  color?: string;
}> = ({ onEdit, category, color }) => (
  <ActionIcon title="Muokkaa" onClick={() => onEdit(category)}>
    <Icons.Edit color={color} />
  </ActionIcon>
);

export const ToggleButton: React.FC<{
  state: boolean;
  onToggle: () => void;
  color?: string;
}> = ({ state, onToggle, color }) => (
  <ActionIcon title={state ? 'Sulje' : 'Avaa'} onClick={onToggle}>
    {state ? <Icons.ExpandLess color={color} /> : <Icons.ExpandMore color={color} />}
  </ActionIcon>
);
