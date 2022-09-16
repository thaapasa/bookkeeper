import * as React from 'react';

import { Category } from 'shared/types';

import { Add, Edit, ExpandLess, ExpandMore, ToolIcon } from '../Icons';

export const AddCategoryButton: React.FC<{
  onAdd: (p?: Category) => void;
  parent?: Category;
  color?: string | null;
  icon?: React.ComponentType<any>;
}> = ({ onAdd, parent, color, icon }) => (
  <ToolIcon
    title="Lisää"
    onClick={() => onAdd(parent)}
    icon={icon || Add}
    color={color}
  />
);

export const EditCategoryButton: React.FC<{
  onEdit: (p: Category) => void;
  category: Category;
  color?: string | null;
}> = ({ onEdit, category, color }) => (
  <ToolIcon
    title="Muokkaa"
    onClick={() => onEdit(category)}
    icon={Edit}
    color={color}
  />
);

export const ToggleButton: React.FC<{
  state: boolean;
  onToggle: () => void;
  color?: string | null;
}> = ({ state, onToggle, color }) => (
  <ToolIcon
    title={state ? 'Sulje' : 'Avaa'}
    onClick={onToggle}
    icon={state ? ExpandLess : ExpandMore}
    color={color}
  />
);
