import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import * as B from 'baconjs';
import * as React from 'react';

import { Category, CategorySelection, ObjectId } from 'shared/types';
import { CategoryDataSource, categoryDataSourceP, categoryMapE } from 'client/data/Categories';
import { connect } from 'client/ui/component/BaconConnect';

const CategorySelectorImpl: React.FC<{
  categorySource: CategoryDataSource[];
  categoryMap: Record<ObjectId, Category>;
  addCategories: (cat: CategorySelection | CategorySelection[]) => void;
  allowSelectAll?: boolean;
}> = ({ categorySource, addCategories, categoryMap, allowSelectAll }) => (
  <FormControl fullWidth>
    <InputLabel>Kategoria</InputLabel>
    <Select
      label="Kategoria"
      value={''}
      onChange={e => {
        const catId = Number(e.target.value);
        if (catId === 0) {
          if (allowSelectAll === false) {
            return;
          }
          // Add all parent categories
          const mainCats = Object.values(categoryMap).filter(c => c.parentId === null);
          addCategories(mainCats.map(c => ({ id: c.id, grouped: true })));
          return;
        }
        const cat = categoryMap[catId];
        if (!cat) return;
        addCategories({ id: cat.id, grouped: cat.parentId === null });
      }}
    >
      {allowSelectAll ? (
        <MenuItem key={0} value={0}>
          Kaikki pääkategoriat
        </MenuItem>
      ) : null}
      {categorySource.map(c => (
        <MenuItem key={c.value} value={c.value}>
          {c.text}
        </MenuItem>
      ))}
    </Select>
  </FormControl>
);

export const CategorySelector = connect(
  B.combineTemplate({
    categorySource: categoryDataSourceP,
    categoryMap: categoryMapE,
  }),
)(CategorySelectorImpl);
