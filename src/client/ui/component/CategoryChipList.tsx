import { Chip } from '@mui/material';
import * as React from 'react';
import styled from 'styled-components';

import { ObjectId } from 'shared/types/Id';
import { Category } from 'shared/types/Session';
import { getFullCategoryName } from 'client/data/Categories';

import { PlusCircle } from '../Icons';

interface CategoryListProps {
  selected: ObjectId[];
  onExpand?: (catId: ObjectId) => void;
  onGroup?: (catId: ObjectId) => void;
  onDelete: (catId: ObjectId) => void;
  categoryMap: Record<ObjectId, Category>;
}

export const CategoryChipList: React.FC<CategoryListProps> = ({
  selected,
  categoryMap,
  ...props
}) => {
  return (
    <>
      {selected.map(catId => (
        <CategoryChip
          {...props}
          key={catId}
          category={categoryMap[catId]}
          categoryMap={categoryMap}
        />
      ))}
    </>
  );
};

const CategoryChip: React.FC<
  Pick<CategoryListProps, 'categoryMap' | 'onDelete' | 'onExpand'> & {
    category: Category;
  }
> = ({ category, categoryMap, onDelete, onExpand }) => {
  const isParent = category.parentId === null;
  return (
    <StyledChip
      key={category.id}
      label={getFullCategoryName(category.id, categoryMap)}
      onDelete={() => onDelete(category.id)}
      variant={isParent ? 'filled' : 'outlined'}
      avatar={isParent ? <PlusCircle /> : undefined}
      onClick={isParent ? () => onExpand?.(category.id) : undefined}
    />
  );
};

const StyledChip = styled(Chip)`
  margin-left: 8px;

  &:first-of-type {
    margin-left: 0px;
  }
`;
