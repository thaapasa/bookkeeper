import { ActionIcon, Checkbox, Grid, Group, Stack } from '@mantine/core';
import React from 'react';
import { z } from 'zod';

import { DateRange } from 'shared/time';
import { CategorySelection, isDefined } from 'shared/types';
import apiConnect from 'client/data/ApiConnect';
import { UninitializedData } from 'client/data/AsyncData';
import { categoryMapP } from 'client/data/Categories';

import { CategoryChipList } from '../category/CategoryChipList';
import { CategorySelector } from '../category/CategorySelector';
import { AsyncDataView } from '../component/AsyncDataView';
import { useAsyncData } from '../hooks/useAsyncData';
import { useBaconProperty } from '../hooks/useBaconState';
import { useIsMobile } from '../hooks/useBreakpoints';
import { useLocalStorageList } from '../hooks/useList.ts';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Icons } from '../icons/Icons';
import { CategoryStatisticsChart } from './category/CategoryStatisticsChart';
import { StatisticsChartTypeSelector } from './ChartTypeSelector';
import { StatisticsChartRangeSelector } from './StatisticsChartRangeSelector';
import { StatisticsChartType } from './types';

function cmpCat(a: CategorySelection, b: CategorySelection) {
  return a.id === b.id;
}

export const StatisticsView: React.FC = () => {
  const categoryMap = useBaconProperty(categoryMapP);

  const {
    list: cats,
    addItems: addCats,
    removeItem: removeCats,
    clear: clearCats,
  } = useLocalStorageList<CategorySelection>(
    'statistics.categories',
    [],
    z.array(CategorySelection),
    cmpCat,
    c => !!categoryMap[c.id],
  );

  const [range, setRange] = React.useState<DateRange | undefined>(undefined);

  const [type, setType] = useLocalStorage('statistics.chart.type', 'years', StatisticsChartType);

  const [stacked, setStacked] = useLocalStorage('statistics.chart.stacked', true, z.boolean());

  const [onlyOwn, setOnlyOwn] = useLocalStorage('statistics.chart.onlyOwn', false, z.boolean());

  const expandCategory = (cat: CategorySelection) => {
    if (!categoryMap) return;
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
    const allChildrenIncluded = children.every(c => cats.find(cmpCat.bind(this, c)) !== undefined);
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
    range?.startDate ?? '2000-01-01',
    range?.endDate ?? '2000-01-01',
    onlyOwn,
  );
  const data = cats.length > 0 ? statistics : UninitializedData;

  const isMobile = useIsMobile();

  return (
    <Grid p="md" gap="md">
      <Grid.Col span={{ base: 12, sm: 6 }}>
        <Stack gap="xs">
          <CategorySelector addCategories={addCats} />
          <Group gap="md" wrap="wrap">
            <Checkbox
              checked={stacked}
              onChange={() => setStacked(!stacked)}
              label="Koosta alueet"
            />
            <Checkbox
              checked={onlyOwn}
              onChange={() => setOnlyOwn(!onlyOwn)}
              label="Vain omat kirjaukset"
            />
          </Group>
        </Stack>
      </Grid.Col>
      <Grid.Col span={{ base: 12, sm: 6 }}>
        <StatisticsChartRangeSelector onChange={setRange} />
      </Grid.Col>
      <Grid.Col span={{ base: 12, sm: 12 }}>
        <StatisticsChartTypeSelector selected={type} onChange={setType} row={isMobile} />
      </Grid.Col>
      {cats.length > 0 ? (
        <Grid.Col span={12}>
          <Group gap="xs">
            <ActionIcon onClick={clearCats}>
              <Icons.Clear />
            </ActionIcon>
            <CategoryChipList
              selected={cats}
              onDelete={removeCats}
              categoryMap={categoryMap}
              onExpand={expandCategory}
            />
          </Group>
        </Grid.Col>
      ) : null}
      <Grid.Col span={12}>
        <AsyncDataView
          data={data}
          renderer={CategoryStatisticsChart}
          type={type}
          categoryMap={categoryMap}
          uninitializedText="Valitse kategoria näyttääksesi tilastot"
          stacked={stacked}
        />
      </Grid.Col>
    </Grid>
  );
};
