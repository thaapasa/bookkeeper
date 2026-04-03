import { Box } from '@mantine/core';
import * as React from 'react';

import { TypedDateRange } from 'shared/time';
import { Category, CategoryAndTotals } from 'shared/types';
import { Money } from 'shared/util';
import apiConnect from 'client/data/ApiConnect';
import { userDataP } from 'client/data/Categories';
import { updateSession, validSessionP } from 'client/data/Login';
import { navigationBus, needUpdateE } from 'client/data/State';
import { categoryPagePath } from 'client/util/Links';

import { useDeferredData } from '../hooks/useAsyncData';
import { useBaconProperty } from '../hooks/useBaconState';
import { CategoryChart, CategoryChartData } from './CategoryChart';
import { CategoryTable } from './CategoryTable';

interface CategoryViewProps {
  range: TypedDateRange;
}

export const CategoryView: React.FC<CategoryViewProps> = ({ range }) => {
  const session = useBaconProperty(validSessionP);
  const userData = useBaconProperty(userDataP);

  const { categories } = session;

  const { data, loadData } = useDeferredData(loadCategories, true, categories, range);

  React.useEffect(() => loadData(), [loadData]);
  React.useEffect(() => needUpdateE.onValue(loadData), [loadData]);

  if (data.type !== 'loaded') return null;

  return (
    <Box>
      <Box h={320} display="flex">
        <CategoryChart chartData={data.value.categoryChartData} />
      </Box>
      <CategoryTable
        categories={categories}
        range={range}
        onCategoriesChanged={updateSession}
        categoryTotals={data.value.categoryTotals}
        userData={userData}
      />
    </Box>
  );
};

async function getCategoryTotals(
  range: TypedDateRange,
): Promise<Record<string, CategoryAndTotals>> {
  const totals = await apiConnect.getCategoryTotals(range.start, range.end);
  const totalsMap: Record<string, CategoryAndTotals> = {};
  totals.forEach(t => {
    totalsMap['' + t.id] = t;
    if (t.children && t.children.length > 0) {
      t.children.forEach(ch => (totalsMap['' + ch.id] = ch));
    }
  });
  return totalsMap;
}

async function loadCategories(categories: Category[], range: TypedDateRange) {
  navigationBus.push({
    pathPrefix: categoryPagePath,
    dateRange: range,
  });
  const categoryTotals = await getCategoryTotals(range);
  const categoryChartData = formCategoryChartData(categories, categoryTotals);
  return { categoryTotals, categoryChartData };
}

function formCategoryChartData(
  categories: Category[],
  categoryTotals: Record<string, CategoryAndTotals>,
): CategoryChartData[] {
  return categories.map(c => ({
    categoryId: c.id,
    categoryName: c.name,
    categoryExpense: Money.toValue(categoryTotals[c.id]?.totalExpenses ?? 0),
    categoryIncome: Money.toValue(categoryTotals[c.id]?.totalIncome ?? 0),
  }));
}
