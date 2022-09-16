import * as React from 'react';

import { Category } from 'shared/types';

import { Icons } from '../icons/Icons';
import { ToolIcon } from '../icons/ToolIcon';

export const AddCategoryButton: React.FC<{
  onAdd: (p?: Category) => void;
  parent?: Category;
  color?: string | null;
  icon?: React.ComponentType<any>;
}> = ({ onAdd, parent, color, icon }) => (
  <ToolIcon
    title="Lisää"
    onClick={() => onAdd(parent)}
    icon={icon || Icons.Add}
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
    icon={Icons.Edit}
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
    icon={state ? Icons.ExpandLess : Icons.ExpandMore}
    color={color}
  />
);
