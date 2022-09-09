import ClearIcon from '@mui/icons-material/Clear';
import {
  Checkbox,
  FormControlLabel,
  FormGroup,
  Grid,
  IconButton,
} from '@mui/material';
import * as B from 'baconjs';
import React from 'react';

import { Category } from 'shared/types/Session';
import { CategoryStatistics } from 'shared/types/Statistics';
import apiConnect from 'client/data/ApiConnect';
import { AsyncData, UninitializedData } from 'client/data/AsyncData';
import { categoryMapE, getFullCategoryName } from 'client/data/Categories';

import { AsyncDataView } from '../component/AsyncDataView';
import { connect } from '../component/BaconConnect';
import { ChipList } from '../component/ChipList';
import { useAsyncData } from '../hooks/useAsyncData';
import { useLocalStorageList } from '../hooks/useList';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { CategorySelector } from './category/CategorySelector';
import { CategoryStatisticsChart } from './category/CategoryStatisticsChart';
import { StatisticsChartTypeSelector } from './ChartTypeSelector';
import { StatisticsChartType } from './types';
export const StatisticsViewImpl: React.FC<{
  categoryMap: Record<string, Category>;
}> = ({ categoryMap }) => {
  const {
    list: cats,
    addItems: addCats,
    removeItem: removeCat,
    clear: clearCats,
  } = useLocalStorageList<number>('statistics.categories');

  const getCatName = React.useCallback(
    (c: number) => getFullCategoryName(c, categoryMap),
    [categoryMap]
  );

  const [type, setType] = useLocalStorage<StatisticsChartType>(
    'statistics.chart.type',
    'years'
  );

  const [stacked, setStacked] = useLocalStorage(
    'statistics.chart.stacked',
    true
  );

  const [onlyOwn, setOnlyOwn] = useLocalStorage(
    'statistics.chart.onlyOwn',
    false
  );

  const [estimated, setEstimated] = useLocalStorage(
    'statistics.chart.estimate',
    false
  );

  const statistics = useAsyncData(
    apiConnect.loadStatistics,
    cats.length > 0,
    cats,
    onlyOwn
  );
  const data: AsyncData<CategoryStatistics> =
    cats.length > 0 ? statistics : UninitializedData;

  return (
    <Grid container columnSpacing={2} rowSpacing={1} padding="16px">
      <Grid item md={6} xs={12}>
        <CategorySelector addCategories={addCats} />
      </Grid>
      <Grid item md={4} xs={10}>
        <StatisticsChartTypeSelector selected={type} onChange={setType} />
      </Grid>
      <Grid item md={2} xs={2}>
        <FormGroup row>
          <FormControlLabel
            control={
              <Checkbox
                checked={stacked}
                onChange={() => setStacked(!stacked)}
              />
            }
            label="Koosta alueet"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={onlyOwn}
                onChange={() => setOnlyOwn(!onlyOwn)}
              />
            }
            label="Vain omat kirjaukset"
          />
        </FormGroup>
        {type === 'years' ? (
          <FormControlLabel
            control={
              <Checkbox
                checked={estimated}
                onChange={() => setEstimated(!estimated)}
              />
            }
            label="Sisällytä arvio"
          />
        ) : null}
      </Grid>
      {cats.length > 0 ? (
        <Grid item xs={12}>
          <IconButton color="primary" onClick={clearCats}>
            <ClearIcon />
          </IconButton>
          <ChipList items={cats} onDelete={removeCat} getName={getCatName} />
        </Grid>
      ) : null}
      <Grid item xs={12}>
        <AsyncDataView
          data={data}
          renderer={CategoryStatisticsChart}
          type={type}
          categoryMap={categoryMap}
          uninitializedText="Valitse kategoria näyttääksesi tilastot"
          stacked={stacked}
          estimated={estimated}
        />
      </Grid>
    </Grid>
  );
};

export const StatisticsView = connect(
  B.combineTemplate({ categoryMap: categoryMapE })
)(StatisticsViewImpl);
