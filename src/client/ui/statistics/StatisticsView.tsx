import { Grid } from '@mui/material';
import * as B from 'baconjs';
import * as React from 'react';

import { Category } from 'shared/types/Session';
import { CategoryStatistics } from 'shared/types/Statistics';
import apiConnect from 'client/data/ApiConnect';
import { AsyncData, UninitializedData } from 'client/data/AsyncData';
import { categoryMapE, getFullCategoryName } from 'client/data/Categories';

import { AsyncDataView } from '../component/AsyncDataView';
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
    addItems: addCats,
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
  const data: AsyncData<CategoryStatistics> =
    cats.length > 0 ? statistics : UninitializedData;

  const [type, setType] = React.useState<StatisticsChartType>('months');

  return (
    <Grid container columnSpacing={2} rowSpacing={1} padding="16px">
      <Grid item md={6} xs={12}>
        <StatisticsSourceView addCategories={addCats} />
      </Grid>
      <Grid item md={6} xs={12}>
        <StatisticsChartTypeSelector selected={type} onChange={setType} />
      </Grid>
      <Grid item xs={12}>
        <ChipList items={cats} onDelete={removeCat} getName={getCatName} />
      </Grid>
      <Grid item xs={12}>
        <AsyncDataView
          data={data}
          renderer={StatisticsChart}
          type={type}
          categoryMap={categoryMap}
          uninitializedText="Valitse kategoria näyttääksesi tilastot"
        />
      </Grid>
    </Grid>
  );
};

export const StatisticsView = connect(
  B.combineTemplate({ categoryMap: categoryMapE })
)(StatisticsViewImpl);
