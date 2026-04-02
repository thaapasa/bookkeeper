import { Badge, CloseButton, Group } from '@mantine/core';
import * as React from 'react';

import { Category, CategorySelection, ObjectId } from 'shared/types';
import { getFullCategoryName } from 'client/data/Categories';

import { Icons } from '../icons/Icons';

interface CategoryListProps {
  selected: CategorySelection[];
  onExpand: (catId: CategorySelection) => void;
  onDelete: (catId: CategorySelection) => void;
  categoryMap: Record<ObjectId, Category>;
}

export const CategoryChipList: React.FC<CategoryListProps> = ({ selected, ...props }) => (
  <Group gap="xs">
    {selected.map(cat => (
      <CategoryChip {...props} key={cat.id} cat={cat} />
    ))}
  </Group>
);

const CategoryChip: React.FC<
  Omit<CategoryListProps, 'selected'> & {
    cat: CategorySelection;
  }
> = ({ cat, categoryMap, onDelete, onExpand }) => {
  const category = categoryMap[cat.id];
  const isParent = category.parentId === null;
  return (
    <Badge
      variant={isParent ? 'filled' : 'outline'}
      leftSection={isParent && cat.grouped ? <Icons.AllInclusive fontSize="small" /> : undefined}
      rightSection={
        <CloseButton
          size="xs"
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            onDelete(cat);
          }}
        />
      }
      onClick={() => onExpand(cat)}
      style={{ cursor: 'pointer' }}
    >
      {getFullCategoryName(category.id, categoryMap)}
    </Badge>
  );
};
