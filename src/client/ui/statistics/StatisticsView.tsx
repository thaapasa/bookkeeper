import { Grid } from '@mui/material';
import * as B from 'baconjs';
import * as React from 'react';

import { Category } from 'shared/types/Session';
import { categoryMapE, getFullCategoryName } from 'client/data/Categories';

import { connect } from '../component/BaconConnect';
import { ChipList } from '../component/ChipList';
import { useList } from '../utils/Hooks';
import { StatisticsSourceView } from './StatisticsSourceView';

export const StatisticsViewImpl: React.FC<{
  categoryMap: Record<string, Category>;
}> = ({ categoryMap }) => {
  const {
    list: cats,
    addItem: addCat,
    removeItem: removeCat,
  } = useList<number>();

  const getCatName = React.useCallback(
    (c: number) => getFullCategoryName(c, categoryMap),
    [categoryMap]
  );

  return (
    <Grid container margin="16px">
      <Grid item xs={12}>
        <StatisticsSourceView addCategory={addCat} />
      </Grid>
      <Grid item xs={12} marginTop="16px">
        <ChipList items={cats} onDelete={removeCat} getName={getCatName} />
      </Grid>
    </Grid>
  );
};
export const StatisticsView = connect(
  B.combineTemplate({ categoryMap: categoryMapE })
)(StatisticsViewImpl);
