import * as React from 'react';
import styled from 'styled-components';
import { rowHeight } from '../expense/ExpenseTableLayout';
import { Category } from '../../../shared/types/Session';
import { AddCategoryButton } from './CategoryTools';
import { colorScheme } from '../Colors';

export const Row = styled.div`
  padding: 0 16px;
  width: calc(100% - 32px);
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
  width: 100px;
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  align-items: center;
  white-space: nowrap;
`;

export const AllColumns = styled.div`
  flex: 1;
`;

export function CategoryHeader({ onAdd }: { onAdd: (p?: Category) => void }) {
  return (
    <Row className="category-header">
      <NameColumn className="header">Nimi</NameColumn>
      <SumColumn className="header">Tulot</SumColumn>
      <SumColumn className="header">Kulut</SumColumn>
      <ToolColumn>
        <AddCategoryButton onAdd={onAdd} color={colorScheme.gray.veryDark} />
      </ToolColumn>
    </Row>
  );
}
