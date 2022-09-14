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

import { isDefined } from 'shared/types/Common';
import { Category } from 'shared/types/Session';
import { CategoryStatistics } from 'shared/types/Statistics';
import { DateRange } from 'shared/util/TimeRange';
import apiConnect from 'client/data/ApiConnect';
import { AsyncData, UninitializedData } from 'client/data/AsyncData';
import { categoryMapE } from 'client/data/Categories';

import { AsyncDataView } from '../component/AsyncDataView';
import { connect } from '../component/BaconConnect';
import { CategoryChipList } from '../component/CategoryChipList';
import { useAsyncData } from '../hooks/useAsyncData';
import { useLocalStorageList } from '../hooks/useList';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { CategorySelector } from './category/CategorySelector';
import { CategoryStatisticsChart } from './category/CategoryStatisticsChart';
import { StatisticsChartTypeSelector } from './ChartTypeSelector';
import { StatisticsChartRangeSelector } from './StatisticsChartRangeSelector';
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

  const [range, setRange] = React.useState<DateRange | undefined>(undefined);

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

  const expandCategory = (parentId: number) => {
    const children = categoryMap[parentId]?.children.map(c => c.id) ?? [];
    if (!children) return;
    if (children.every(c => cats.includes(c))) removeCat(children);
    else addCats(children);
  };

  const statistics = useAsyncData(
    apiConnect.loadStatistics,
    cats.length > 0 && isDefined(range),
    cats,
    range?.startDate ?? '',
    range?.endDate ?? '',
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
      </Grid>
      <Grid item xs={12}>
        <StatisticsChartRangeSelector onChange={setRange} />
      </Grid>
      {cats.length > 0 ? (
        <Grid item xs={12}>
          <IconButton color="primary" onClick={clearCats}>
            <ClearIcon />
          </IconButton>
          <CategoryChipList
            selected={cats}
            onDelete={removeCat}
            categoryMap={categoryMap}
            onExpand={expandCategory}
          />
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
        />
      </Grid>
    </Grid>
  );
};

export const StatisticsView = connect(
  B.combineTemplate({ categoryMap: categoryMapE })
)(StatisticsViewImpl);
