import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as React from 'react';
import { useParams } from 'react-router';

import { ExpenseQuery } from 'shared/expense';
import { ISOMonth, ISOMonthRegExp, toDateRange, toISODate } from 'shared/time';
import { Category, CategoryMap, isDefined } from 'shared/types';
import apiConnect from 'client/data/ApiConnect';
import { CategoryDataSource, categoryDataSourceP, userDataP } from 'client/data/Categories';
import { QueryKeys } from 'client/data/queryKeys';
import { navigationBus } from 'client/data/State';
import { logger } from 'client/Logger';
import { searchPagePath } from 'client/util/Links';

import { useBaconProperty } from '../hooks/useBaconState';
import { QueryView, QueryViewHandle } from './QueryView';
import { ResultsView } from './ResultsView';

type SearchViewParams = 'year' | 'month';

function isEmptyQuery(q: ExpenseQuery) {
  const hasCategory =
    typeof q.categoryId === 'number' ||
    (typeof q.categoryId === 'object' && q.categoryId.length > 0);
  return !q.search && !hasCategory && !q.receiver && !isDefined(q.confirmed);
}

export const SearchPage: React.FC = () => {
  const userData = useBaconProperty(userDataP);
  const categorySource = useBaconProperty(categoryDataSourceP);

  return <SearchViewImpl userData={userData} categorySource={categorySource} />;
};

const SearchViewImpl: React.FC<{
  userData: { categoryMap: CategoryMap };
  categorySource: CategoryDataSource[];
}> = ({ userData, categorySource }) => {
  const queryClient = useQueryClient();
  const { year, month } = useParams<SearchViewParams>();
  const [query, setQuery] = React.useState<ExpenseQuery | undefined>(undefined);

  const enabled = !!query && !isEmptyQuery(query);

  // Update navigation state when search is triggered
  React.useEffect(() => {
    if (query) {
      navigationBus.push({
        pathPrefix: searchPagePath,
        dateRange: toDateRange(query.startDate ?? toISODate(), query.endDate ?? toISODate()),
      });
    }
  }, [query]);

  const { data, isFetching } = useQuery({
    queryKey: QueryKeys.search.results(query!),
    queryFn: () => apiConnect.searchExpenses(query!),
    enabled,
  });

  const onSearch = React.useCallback(
    (newQuery: ExpenseQuery) => {
      logger.info(newQuery, 'Searching for');
      setQuery(newQuery);
    },
    [setQuery],
  );

  const onRepeatSearch = React.useCallback(() => {
    if (query) {
      queryClient.invalidateQueries({ queryKey: QueryKeys.search.results(query) });
    }
  }, [queryClient, query]);

  const queryRef = React.useRef<QueryViewHandle>(null);

  const onAddCategoryToSearch = React.useCallback(
    (cat: Category) => queryRef.current?.addCategory(cat),
    [queryRef],
  );

  return (
    <>
      <QueryView
        ref={queryRef}
        categoryMap={userData.categoryMap}
        categorySource={categorySource}
        onSearch={onSearch}
        isSearching={isFetching}
        year={year}
        month={month && ISOMonthRegExp.test(month) ? (month as ISOMonth) : undefined}
      />
      <ResultsView
        results={data ?? []}
        onUpdate={onRepeatSearch}
        onSelectCategory={onAddCategoryToSearch}
      />
    </>
  );
};
