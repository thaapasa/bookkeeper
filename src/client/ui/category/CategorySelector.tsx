import { Select } from '@mantine/core';
import * as B from 'baconjs';
import * as React from 'react';

import { Category, CategorySelection, ObjectId } from 'shared/types';
import { CategoryDataSource, categoryDataSourceP, categoryMapP } from 'client/data/Categories';
import { connect } from 'client/ui/component/BaconConnect';

const CategorySelectorImpl: React.FC<{
  categorySource: CategoryDataSource[];
  categoryMap: Record<ObjectId, Category>;
  addCategories: (cat: CategorySelection | CategorySelection[]) => void;
  allowSelectAll?: boolean;
}> = ({ categorySource, addCategories, categoryMap, allowSelectAll }) => {
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
          const mainCats = Object.values(categoryMap).filter(c => c.parentId === null);
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

export const CategorySelector = connect(
  B.combineTemplate({
    categorySource: categoryDataSourceP,
    categoryMap: categoryMapP,
  }),
)(CategorySelectorImpl);
