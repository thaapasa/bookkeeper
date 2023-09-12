import { styled } from '@mui/material';
import * as B from 'baconjs';
import * as React from 'react';

import { TypedDateRange } from 'shared/time';
import { Category, CategoryAndTotals } from 'shared/types';
import { Money } from 'shared/util';
import apiConnect from 'client/data/ApiConnect';
import { userDataE, UserDataProps } from 'client/data/Categories';
import { updateSession, validSessionE } from 'client/data/Login';
import { navigationBus, needUpdateE } from 'client/data/State';
import { categoryPagePath } from 'client/util/Links';

import { connect } from '../component/BaconConnect';
import { useDeferredData } from '../hooks/useAsyncData';
import { PageContentContainer } from '../Styles';
import { CategoryChart, CategoryChartData } from './CategoryChart';
import { CategoryTable } from './CategoryTable';

interface CategoryViewProps {
  categories: Category[];
  range: TypedDateRange;
  userData: UserDataProps;
}

const CategoryView: React.FC<CategoryViewProps> = ({
  range,
  categories,
  ...rest
}) => {
  const { data, loadData } = useDeferredData(
    loadCategories,
    true,
    categories,
    range
  );

  // Load data when range / categories change
  React.useEffect(() => loadData(), [loadData]);

  // Load data when needUpdate is signalled
  React.useEffect(() => needUpdateE.onValue(loadData), [loadData]);

  if (data.type !== 'loaded') {
    return null;
  }
  return (
    <PageContentContainer>
      <div>
        <StyledChart chartData={data.value.categoryChartData} />
        <CategoryTable
          {...rest}
          categories={categories}
          range={range}
          onCategoriesChanged={updateSession}
          categoryTotals={data.value.categoryTotals}
        />
      </div>
    </PageContentContainer>
  );
};

async function getCategoryTotals(
  range: TypedDateRange
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
  categoryTotals: Record<string, CategoryAndTotals>
): CategoryChartData[] {
  return categories.map(c => ({
    categoryId: c.id,
    categoryName: c.name,
    categoryExpense: Money.toValue(categoryTotals[c.id]?.totalExpenses ?? 0),
    categoryIncome: Money.toValue(categoryTotals[c.id]?.totalIncome ?? 0),
  }));
}

export default connect(
  B.combineTemplate({
    categories: validSessionE.map(s => s.categories),
    userData: userDataE,
  })
)(CategoryView);

const StyledChart = styled(CategoryChart)`
  height: 320px;
`;
