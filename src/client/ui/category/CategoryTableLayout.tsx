import styled from '@emotion/styled';
import * as React from 'react';

import { Category } from 'shared/types';

import { neutral, primary } from '../Colors';
import { Row } from '../component/Row';
import { AddCategoryButton } from './CategoryTools';

export const RowElement = styled(Row)`
  &.category-header {
    background-color: ${neutral[1]};
  }
  &.main-category {
    background-color: ${neutral[4]};
  }
  &.sub-category {
    background-color: ${neutral[2]};
  }
`;

export const NameColumn = styled.div`
  flex: 1;
  padding-left: 16px;
  &.header {
    font-weight: bold;
  }
  .sub-category & {
    color: ${primary[7]};
  }
  .main-category & {
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
    color: ${neutral[5]};
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

export const CategoryHeader: React.FC<{ onAdd: (p?: Category) => void }> = ({ onAdd }) => (
  <RowElement className="category-header">
    <NameColumn className="header">Nimi</NameColumn>
    <SumColumn className="header">Tulot</SumColumn>
    <SumColumn className="header">Kulut</SumColumn>
    <ToolColumn>
      <AddCategoryButton onAdd={onAdd} color={neutral[7]} icon="PlusCircle" />
    </ToolColumn>
  </RowElement>
);
