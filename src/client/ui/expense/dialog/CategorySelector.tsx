import { Group, GroupProps, Select } from '@mantine/core';
import * as React from 'react';

import { ObjectId } from 'shared/types';
import { stopEventPropagation } from 'client/util/ClientUtil';

interface CategoryOption {
  id: ObjectId;
  name: string;
}

export const CategorySelector: React.FC<
  {
    category: ObjectId;
    subcategory: ObjectId;
    categories: CategoryOption[];
    subcategories: CategoryOption[];
    onChangeCategory: (id: ObjectId) => void;
    onChangeSubcategory: (id: ObjectId) => void;
    errorText?: string;
  } & GroupProps
> = ({
  category,
  onChangeCategory,
  onChangeSubcategory,
  categories,
  errorText,
  subcategory,
  subcategories,
  ...props
}) => (
  <Group onKeyUp={stopEventPropagation} gap="md" wrap="nowrap" {...props}>
    <Select
      label="Kategoria"
      value={String(category)}
      onChange={v => onChangeCategory(Number(v ?? 0))}
      data={[
        { value: '0', label: '-- Valitse --' },
        ...categories.map(row => ({ value: String(row.id), label: row.name })),
      ]}
      error={errorText || undefined}
      flex={1}
    />
    <Select
      label="Alikategoria"
      value={String(subcategory)}
      onChange={v => onChangeSubcategory(Number(v ?? 0))}
      data={[
        { value: '0', label: '-- Valitse --' },
        ...subcategories.map(row => ({ value: String(row.id), label: row.name })),
      ]}
      flex={1}
    />
  </Group>
);
