import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import * as B from 'baconjs';
import * as React from 'react';

import {
  CategoryDataSource,
  categoryDataSourceP,
} from 'client/data/Categories';

import { connect } from '../component/BaconConnect';

const StatisticsSourceImpl: React.FC<{
  categorySource: CategoryDataSource[];
  addCategory: (cat: number) => void;
}> = ({ categorySource, addCategory }) => (
  <FormControl fullWidth>
    <InputLabel>Kategoria</InputLabel>
    <Select
      label="Kategoria"
      value={''}
      onChange={e => addCategory(Number(e.target.value))}
    >
      {categorySource.map(c => (
        <MenuItem key={c.value} value={c.value}>
          {c.text}
        </MenuItem>
      ))}
    </Select>
  </FormControl>
);

export const StatisticsSourceView = connect(
  B.combineTemplate({
    categorySource: categoryDataSourceP,
  })
)(StatisticsSourceImpl);
