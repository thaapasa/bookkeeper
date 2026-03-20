import styled from '@emotion/styled';
import { Badge, CloseButton } from '@mantine/core';
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
  <>
    {selected.map(cat => (
      <CategoryChip {...props} key={cat.id} cat={cat} />
    ))}
  </>
);

const CategoryChip: React.FC<
  Omit<CategoryListProps, 'selected'> & {
    cat: CategorySelection;
  }
> = ({ cat, categoryMap, onDelete, onExpand }) => {
  const category = categoryMap[cat.id];
  const isParent = category.parentId === null;
  return (
    <StyledBadge
      variant={isParent ? 'filled' : 'outline'}
      leftSection={isParent && cat.grouped ? <Icons.AllInclusive fontSize="small" /> : undefined}
      rightSection={<CloseButton size="xs" onClick={(e: React.MouseEvent) => { e.stopPropagation(); onDelete(cat); }} />}
      onClick={() => onExpand(cat)}
      style={{ cursor: 'pointer' }}
    >
      {getFullCategoryName(category.id, categoryMap)}
    </StyledBadge>
  );
};

const StyledBadge = styled(Badge)`
  margin-left: 8px;
  &:first-of-type {
    margin-left: 0px;
  }
` as any;
