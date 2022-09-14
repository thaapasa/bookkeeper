import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import * as B from 'baconjs';
import * as React from 'react';

import { ObjectId } from 'shared/types/Id';
import { Category } from 'shared/types/Session';
import { CategorySelection } from 'shared/types/Statistics';
import {
  CategoryDataSource,
  categoryDataSourceP,
  categoryMapE,
} from 'client/data/Categories';

import { connect } from '../../component/BaconConnect';

const CategorySelectorImpl: React.FC<{
  categorySource: CategoryDataSource[];
  categoryMap: Record<ObjectId, Category>;
  addCategories: (cat: CategorySelection) => void;
}> = ({ categorySource, addCategories, categoryMap }) => (
  <FormControl fullWidth>
    <InputLabel>Kategoria</InputLabel>
    <Select
      label="Kategoria"
      value={''}
      onChange={e => {
        const catId = Number(e.target.value);
        const cat = categoryMap[catId];
        if (!cat) return;
        addCategories({ id: cat.id, grouped: cat.parentId === null });
      }}
    >
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
  })
)(CategorySelectorImpl);
