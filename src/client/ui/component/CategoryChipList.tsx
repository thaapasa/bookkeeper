import AllInclusiveIcon from '@mui/icons-material/AllInclusive';
import { Chip } from '@mui/material';
import * as React from 'react';
import styled from 'styled-components';

import { Category, CategorySelection, ObjectId } from 'shared/types';
import { getFullCategoryName } from 'client/data/Categories';

interface CategoryListProps {
  selected: CategorySelection[];
  onExpand: (catId: CategorySelection) => void;
  onDelete: (catId: CategorySelection) => void;
  categoryMap: Record<ObjectId, Category>;
}

export const CategoryChipList: React.FC<CategoryListProps> = ({
  selected,
  ...props
}) => (
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
    <StyledChip
      key={category.id}
      label={getFullCategoryName(category.id, categoryMap)}
      onDelete={() => onDelete(cat)}
      variant={isParent ? 'filled' : 'outlined'}
      avatar={isParent && cat.grouped ? <AllInclusiveIcon /> : undefined}
      onClick={() => onExpand(cat)}
    />
  );
};

const StyledChip = styled(Chip)`
  margin-left: 8px;

  &:first-of-type {
    margin-left: 0px;
  }
`;
