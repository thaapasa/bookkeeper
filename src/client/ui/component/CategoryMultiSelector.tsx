import { MultiSelect, MultiSelectProps } from '@mantine/core';
import * as React from 'react';

import { ObjectId } from 'shared/types';
import { useCategoryDataSource, useCategoryMap } from 'client/data/SessionStore';

type CategoryMultiSelectorProps = {
  value: ObjectId[];
  onChange: (ids: ObjectId[]) => void;
  mainOnly?: boolean;
} & Omit<MultiSelectProps, 'data' | 'value' | 'onChange' | 'searchable'>;

export const CategoryMultiSelector: React.FC<CategoryMultiSelectorProps> = ({
  value,
  onChange,
  mainOnly,
  ...props
}) => {
  const categorySource = useCategoryDataSource()!;
  const categoryMap = useCategoryMap()!;

  const data = React.useMemo(() => {
    const items = mainOnly
      ? categorySource.filter(c => categoryMap[c.value]?.parentId === null)
      : categorySource;
    return items.map(c => ({ value: String(c.value), label: c.text }));
  }, [categorySource, categoryMap, mainOnly]);

  return (
    <MultiSelect
      value={value.map(String)}
      onChange={vs => onChange(vs.map(v => Number(v)))}
      data={data}
      searchable
      clearable
      {...props}
    />
  );
};
