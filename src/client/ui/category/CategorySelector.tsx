import { Select } from '@mantine/core';
import * as React from 'react';

import { Category, CategorySelection } from 'shared/types';
import { useCategoryDataSource, useCategoryMap } from 'client/data/SessionStore';

export const CategorySelector: React.FC<{
  addCategories: (cat: CategorySelection | CategorySelection[]) => void;
  allowSelectAll?: boolean;
}> = ({ addCategories, allowSelectAll }) => {
  const categorySource = useCategoryDataSource()!;
  const categoryMap = useCategoryMap()!;

  const data = React.useMemo(() => {
    const items = categorySource.map(c => ({ value: String(c.value), label: c.text }));
    if (allowSelectAll) {
      items.unshift({ value: '0', label: 'Kaikki pääkategoriat' });
    }
    return items;
  }, [categorySource, allowSelectAll]);

  return (
    <Select
      label="Kategoria"
      value={null}
      placeholder="Valitse kategoria"
      data={data}
      onChange={val => {
        if (!val) return;
        const catId = Number(val);
        if (catId === 0) {
          if (allowSelectAll === false) return;
          const mainCats = Object.values(categoryMap).filter((c: Category) => c.parentId === null);
          addCategories(mainCats.map(c => ({ id: c.id, grouped: true })));
          return;
        }
        const cat = categoryMap[catId];
        if (!cat) return;
        addCategories({ id: cat.id, grouped: cat.parentId === null });
      }}
      searchable
      clearable
    />
  );
};
