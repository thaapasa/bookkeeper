import styled from '@emotion/styled';
import { ActionIcon, Checkbox, ScrollArea } from '@mantine/core';
import * as B from 'baconjs';
import React from 'react';
import { z } from 'zod';

import { DateRange } from 'shared/time';
import { CategoryMap, CategorySelection, CategoryStatistics, isDefined } from 'shared/types';
import apiConnect from 'client/data/ApiConnect';
import { AsyncData, UninitializedData } from 'client/data/AsyncData';
import { categoryMapP } from 'client/data/Categories';
import { windowSizeP } from 'client/data/State';

import { AsyncDataView } from '../component/AsyncDataView';
import { connect } from '../component/BaconConnect';
import { CategoryChipList } from '../category/CategoryChipList';
import { CategorySelector } from '../category/CategorySelector';
import { useAsyncData } from '../hooks/useAsyncData';
import { useLocalStorageList } from '../hooks/useList';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Icons } from '../icons/Icons';
import { isMobileSize, media, Size } from '../Styles';
import { CategoryStatisticsChart } from './category/CategoryStatisticsChart';
import { StatisticsChartTypeSelector } from './ChartTypeSelector';
import { StatisticsChartRangeSelector } from './StatisticsChartRangeSelector';
import { StatisticsChartType } from './types';

function cmpCat(a: CategorySelection, b: CategorySelection) {
  return a.id === b.id;
}

export const StatisticsViewImpl: React.FC<{
  categoryMap: CategoryMap;
  size: Size;
}> = ({ categoryMap, size }) => {
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
  const data: AsyncData<CategoryStatistics> = cats.length > 0 ? statistics : UninitializedData;

  const isMobile = isMobileSize(size);
  return (
    <ScrollArea h="100%" type="auto" bg="neutral.1">
      <StatsGrid>
        <div>
          <CategorySelector addCategories={addCats} />
          <CheckboxRow>
            <Checkbox checked={stacked} onChange={() => setStacked(!stacked)} label="Koosta alueet" />
            <Checkbox checked={onlyOwn} onChange={() => setOnlyOwn(!onlyOwn)} label="Vain omat kirjaukset" />
          </CheckboxRow>
        </div>
        <div>
          <StatisticsChartTypeSelector selected={type} onChange={setType} row={isMobile} />
        </div>
        <div>
          <StatisticsChartRangeSelector onChange={setRange} />
        </div>
        {cats.length > 0 ? (
          <FullWidth>
            <ActionIcon variant="subtle" onClick={clearCats}>
              <Icons.Clear />
            </ActionIcon>
            <CategoryChipList
              selected={cats}
              onDelete={removeCats}
              categoryMap={categoryMap}
              onExpand={expandCategory}
            />
          </FullWidth>
        ) : null}
        <FullWidth>
          <AsyncDataView
            data={data}
            renderer={CategoryStatisticsChart}
            type={type}
            categoryMap={categoryMap}
            uninitializedText="Valitse kategoria näyttääksesi tilastot"
            stacked={stacked}
          />
        </FullWidth>
      </StatsGrid>
    </ScrollArea>
  );
};

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px 16px;
  padding: 16px;
  ${media.web`grid-template-columns: 5fr 2fr 5fr;`}
`;

const FullWidth = styled.div`
  grid-column: 1 / -1;
`;

const CheckboxRow = styled.div`
  display: flex;
  flex-direction: row;
  gap: 16px;
  flex-wrap: wrap;
`;

export const StatisticsView = connect(
  B.combineTemplate({ categoryMap: categoryMapP, size: windowSizeP }),
)(StatisticsViewImpl);
