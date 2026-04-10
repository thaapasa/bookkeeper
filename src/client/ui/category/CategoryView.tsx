import { Box } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import * as React from 'react';

import { TypedDateRange } from 'shared/time';
import { Category, CategoryAndTotals } from 'shared/types';
import { Money } from 'shared/util';
import apiConnect from 'client/data/ApiConnect';
import { updateSession } from 'client/data/Login';
import { QueryKeys } from 'client/data/queryKeys';
import { useUserData, useValidSession } from 'client/data/SessionStore';
import { navigationBus } from 'client/data/State';
import { categoryPagePath } from 'client/util/Links';

import { CategoryChart, CategoryChartData } from './CategoryChart';
import { CategoryTable } from './CategoryTable';

interface CategoryViewProps {
  range: TypedDateRange;
}

export const CategoryView: React.FC<CategoryViewProps> = ({ range }) => {
  const session = useValidSession();
  const userData = useUserData()!;

  const { categories } = session;

  React.useEffect(() => {
    navigationBus.push({ pathPrefix: categoryPagePath, dateRange: range });
  }, [range]);

  const { data: categoryTotals } = useQuery({
    queryKey: QueryKeys.categories.totals(range.start, range.end),
    queryFn: () => getCategoryTotals(range),
  });

  const categoryChartData = React.useMemo(
    () => (categoryTotals ? formCategoryChartData(categories, categoryTotals) : []),
    [categories, categoryTotals],
  );

  if (!categoryTotals) return null;

  return (
    <Box>
      <Box h={320} display="flex">
        <CategoryChart chartData={categoryChartData} />
      </Box>
      <CategoryTable
        categories={categories}
        range={range}
        onCategoriesChanged={updateSession}
        categoryTotals={categoryTotals}
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
