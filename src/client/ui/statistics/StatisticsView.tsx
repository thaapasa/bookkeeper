import { Grid } from '@mui/material';
import * as B from 'baconjs';
import * as React from 'react';

import { Category } from 'shared/types/Session';
import apiConnect from 'client/data/ApiConnect';
import { UninitializedData } from 'client/data/AsyncData';
import { categoryMapE, getFullCategoryName } from 'client/data/Categories';

import { connect } from '../component/BaconConnect';
import { ChipList } from '../component/ChipList';
import { useAsyncData } from '../hooks/useAsyncData';
import { useList } from '../hooks/useList';
import { StatisticsChartTypeSelector } from './ChartTypeSelector';
import { StatisticsChart } from './StatisticsChart';
import { StatisticsSourceView } from './StatisticsSourceView';
import { StatisticsChartType } from './types';

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

  const statistics = useAsyncData(
    apiConnect.loadStatistics,
    cats.length > 0,
    cats
  );
  const data = cats.length > 0 ? statistics : UninitializedData;

  const [type, setType] = React.useState<StatisticsChartType>('months');

  return (
    <Grid container margin="16px">
      <Grid item xs={6} paddingRight="16px">
        <StatisticsSourceView addCategory={addCat} />
      </Grid>
      <Grid item xs={6}>
        <StatisticsChartTypeSelector selected={type} onChange={setType} />
      </Grid>
      <Grid item xs={12} marginTop="16px">
        <ChipList items={cats} onDelete={removeCat} getName={getCatName} />
      </Grid>
      <Grid item xs={12} marginTop="16px">
        {data.type === 'loaded' ? (
          <StatisticsChart
            type={type}
            statistics={data.value}
            categoryMap={categoryMap}
          />
        ) : (
          JSON.stringify(data, null, 2)
        )}
      </Grid>
    </Grid>
  );
};

export const StatisticsView = connect(
  B.combineTemplate({ categoryMap: categoryMapE })
)(StatisticsViewImpl);
