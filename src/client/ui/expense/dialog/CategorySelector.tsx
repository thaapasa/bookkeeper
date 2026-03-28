import styled from '@emotion/styled';
import { Select } from '@mantine/core';
import * as React from 'react';

import { ObjectId } from 'shared/types';
import { stopEventPropagation } from 'client/util/ClientUtil';

interface CategoryOption {
  id: ObjectId;
  name: string;
}

export const CategorySelector: React.FC<{
  category: ObjectId;
  subcategory: ObjectId;
  categories: CategoryOption[];
  subcategories: CategoryOption[];
  onChangeCategory: (id: ObjectId) => void;
  onChangeSubcategory: (id: ObjectId) => void;
  errorText?: string;
  className?: string;
}> = props => (
  <Row onKeyUp={stopEventPropagation} className={props.className}>
    <SelectWrapper>
      <Select
        label="Kategoria"
        value={String(props.category)}
        onChange={v => props.onChangeCategory(Number(v ?? 0))}
        data={[
          { value: '0', label: '-- Valitse --' },
          ...props.categories.map(row => ({ value: String(row.id), label: row.name })),
        ]}
        error={props.errorText || undefined}
      />
    </SelectWrapper>
    <SelectWrapper>
      <Select
        label="Alikategoria"
        value={String(props.subcategory)}
        onChange={v => props.onChangeSubcategory(Number(v ?? 0))}
        data={[
          { value: '0', label: '-- Valitse --' },
          ...props.subcategories.map(row => ({ value: String(row.id), label: row.name })),
        ]}
      />
    </SelectWrapper>
  </Row>
);

const Row = styled.div`
  display: flex;
  flex-direction: row;
  flex: 1;
  align-items: flex-start;
  justify-content: flex-start;
  gap: 16px;
`;

const SelectWrapper = styled.div`
  width: 100%;
`;
