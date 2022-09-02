import { Chip } from '@mui/material';
import * as React from 'react';
import styled from 'styled-components';

interface ChipListProps<T> {
  items: T[];
  onDelete: (item: T) => void;
  getName: (item: T) => string;
}

export const ChipList: React.FC<ChipListProps<any>> = ({
  items,
  onDelete,
  getName,
}) => {
  return (
    <>
      {items.map((item, idx) => (
        <StyledChip
          key={
            typeof item === 'object' && item && 'id' in item
              ? item.id
              : typeof item === 'string' || typeof item === 'number'
              ? item
              : idx
          }
          label={getName(item)}
          onDelete={() => onDelete(item)}
        />
      ))}
    </>
  );
};

const StyledChip = styled(Chip)`
  margin-left: 8px;

  &:first-of-type {
    margin-left: 0px;
  }
`;
