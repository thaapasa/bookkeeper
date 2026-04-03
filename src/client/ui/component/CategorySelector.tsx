import { Select, SelectProps } from '@mantine/core';
import * as React from 'react';

import { ObjectId } from 'shared/types';
import { categoryDataSourceP, categoryMapP } from 'client/data/Categories';

import { useBaconState } from '../hooks/useBaconState';

type CategorySelectorProps = {
  value: ObjectId;
  onChange: (id: ObjectId) => void;
  mainOnly?: boolean;
} & Omit<SelectProps, 'data' | 'value' | 'onChange' | 'searchable'>;

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  value,
  onChange,
  mainOnly,
  ...props
}) => {
  const categorySource = useBaconState(categoryDataSourceP);
  const categoryMap = useBaconState(categoryMapP);

  const data = React.useMemo(() => {
    if (!categorySource || !categoryMap) return [];
    const items = mainOnly
      ? categorySource.filter(c => categoryMap[c.value]?.parentId === null)
      : categorySource;
    return items.map(c => ({ value: String(c.value), label: c.text }));
  }, [categorySource, categoryMap, mainOnly]);

  if (!categorySource || !categoryMap) return null;

  return (
    <Select
      label="Kategoria"
      value={value ? String(value) : null}
      onChange={v => onChange(Number(v ?? 0))}
      data={data}
      searchable
      onFocus={e => (e.target as HTMLInputElement).select()}
      {...props}
    />
  );
};
