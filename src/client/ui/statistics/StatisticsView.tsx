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
import { z } from 'zod';

import { DateRange } from 'shared/time';
import { isDefined } from 'shared/types/Common';
import { Category } from 'shared/types/Session';
import { CategorySelection, CategoryStatistics } from 'shared/types/Statistics';
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

function cmpCat(a: CategorySelection, b: CategorySelection) {
  return a.id === b.id;
}

export const StatisticsViewImpl: React.FC<{
  categoryMap: Record<string, Category>;
}> = ({ categoryMap }) => {
  const {
    list: cats,
    addItems: addCats,
    removeItem: removeCats,
    clear: clearCats,
  } = useLocalStorageList<CategorySelection>(
    'statistics.categories',
    [],
    z.array(CategorySelection),
    cmpCat
  );

  const [range, setRange] = React.useState<DateRange | undefined>(undefined);

  const [type, setType] = useLocalStorage(
    'statistics.chart.type',
    'years',
    StatisticsChartType
  );

  const [stacked, setStacked] = useLocalStorage(
    'statistics.chart.stacked',
    true,
    z.boolean()
  );

  const [onlyOwn, setOnlyOwn] = useLocalStorage(
    'statistics.chart.onlyOwn',
    false,
    z.boolean()
  );

  const expandCategory = (cat: CategorySelection) => {
    const category = categoryMap[cat.id];
    if (!category) return;

    const children = category?.children?.map(c => ({ id: c.id })) ?? [];
    if (children.length < 1) {
      // This is a child category
      if (category.parentId && category.parentId !== cat.id) {
        const parentEntry = { id: category.parentId };
        if (cats.find(cmpCat.bind(this, parentEntry)) === undefined) {
          addCats(parentEntry);
        }
      }
      return;
    }

    // Prio 1: remove grouping
    if (cat.grouped) {
      removeCats(cat);
      addCats({ ...cat, grouped: false });
      return;
    }

    // Prio 2: add all child cats
    const allChildrenIncluded = children.every(
      c => cats.find(cmpCat.bind(this, c)) !== undefined
    );
    if (!allChildrenIncluded) {
      addCats(children);
      return;
    }

    // Prio 3: remove children and group
    removeCats(children);
    removeCats(cat);
    addCats({ ...cat, grouped: true });
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
            onDelete={removeCats}
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
