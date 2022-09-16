import * as React from 'react';
import styled from 'styled-components';

import { Category } from 'shared/types';

import { colorScheme } from '../Colors';
import { rowHeight } from '../expense/row/ExpenseTableLayout';
import { PlusCircle } from '../Icons';
import { AddCategoryButton } from './CategoryTools';

export const Row = styled.div`
  width: 100%;
  min-height: ${rowHeight}px;
  display: flex;
  flex-direction: row;
  align-items: center;
  background-color: ${colorScheme.gray.light};
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

export const NameColumn = styled.div`
  flex: 1;
  padding-left: 16px;
  &.header {
    font-weight: bold;
  }
  ${Row}.sub-category & {
    color: ${colorScheme.secondary.dark};
  }
  ${Row}.main-category & {
    font-weight: bold;
  }
`;

export const SumColumn = styled.div`
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

export const ToolColumn = styled.div`
  padding-right: 12px;
  width: 70px;
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  align-items: center;
  white-space: nowrap;
`;

export const AllColumns = styled.div`
  flex: 1;
  padding: 0 16px;
`;

export const CategoryHeader: React.FC<{ onAdd: (p?: Category) => void }> = ({
  onAdd,
}) => (
  <Row className="category-header">
    <NameColumn className="header">Nimi</NameColumn>
    <SumColumn className="header">Tulot</SumColumn>
    <SumColumn className="header">Kulut</SumColumn>
    <ToolColumn>
      <AddCategoryButton
        onAdd={onAdd}
        color={colorScheme.gray.veryDark}
        icon={PlusCircle}
      />
    </ToolColumn>
  </Row>
);
