import { styled } from '@mui/material';
import * as React from 'react';

import { Category } from 'shared/types';

import { colorScheme } from '../Colors';
import { Row } from '../component/Row';
import { AddCategoryButton } from './CategoryTools';
import { styled } from '@mui/material';

export const RowElement = styled(Row)`
  &.category-header {
    background-color: ${colorScheme.primary.light};
  }
  &.main-category {
    background-color: ${colorScheme.primary.dark};
  }
  &.sub-category {
    background-color: ${colorScheme.primary.standard};
  }
`;

export const NameColumn = styled('div')`
  flex: 1;
  padding-left: 16px;
  &.header {
    font-weight: bold;
  }
  .sub-category & {
    color: ${colorScheme.secondary.dark};
  }
  .main-category & {
    font-weight: bold;
  }
`;

export const SumColumn = styled('div')`
  padding: 0;
  padding-right: 8px;
  white-space: nowrap;
  width: 75px;
  text-align: right;
  &.header {
    font-weight: bold;
  }
  &.unimportant {
    color: ${colorScheme.gray.dark};
    opacity: 0.5;
  }
`;

export const ToolColumn = styled('div')`
  padding-right: 12px;
  width: 70px;
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  align-items: center;
  white-space: nowrap;
`;

export const AllColumns = styled('div')`
  flex: 1;
  padding: 0 16px;
`;

export const CategoryHeader: React.FC<{ onAdd: (p?: Category) => void }> = ({ onAdd }) => (
  <RowElement className="category-header">
    <NameColumn className="header">Nimi</NameColumn>
    <SumColumn className="header">Tulot</SumColumn>
    <SumColumn className="header">Kulut</SumColumn>
    <ToolColumn>
      <AddCategoryButton onAdd={onAdd} color={colorScheme.gray.veryDark} icon="PlusCircle" />
    </ToolColumn>
  </RowElement>
);
