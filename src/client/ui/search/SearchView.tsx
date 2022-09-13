import * as B from 'baconjs';
import debug from 'debug';
import * as React from 'react';
import { RouteComponentProps } from 'react-router';

import { ExpenseQuery, UserExpense } from 'shared/types/Expense';
import { Category, Session } from 'shared/types/Session';
import { toDateRange } from 'shared/util/TimeRange';
import apiConnect from 'client/data/ApiConnect';
import { AsyncData, UninitializedData } from 'client/data/AsyncData';
import {
  CategoryDataSource,
  categoryDataSourceP,
  userDataE,
  UserDataProps,
} from 'client/data/Categories';
import { validSessionE } from 'client/data/Login';
import { navigationBus, needUpdateE } from 'client/data/State';
import { searchPagePath } from 'client/util/Links';

import { connect } from '../component/BaconConnect';
import { usePersistentMemo } from '../hooks/usePersistentMemo';
import { useWhenMounted } from '../hooks/useWhenMounted';
import { PageContentContainer } from '../Styles';
import { QueryView } from './QueryView';
import { ResultsView } from './ResultsView';

const log = debug('bookkeeper:expense-search');

interface SearchViewProps {
  userData: UserDataProps;
  session: Session;
  categorySource: CategoryDataSource[];
}

function isEmptyQuery(q: ExpenseQuery) {
  const hasCategory =
    typeof q.categoryId === 'number' ||
    (typeof q.categoryId === 'object' && q.categoryId.length > 0);
  return !q.search && !hasCategory && !q.receiver;
}

const SearchViewImpl: React.FC<
  RouteComponentProps<{ year?: string; month?: string }> & SearchViewProps
> = ({ userData, session, categorySource, match }) => {
  const [results, setResults] =
    React.useState<AsyncData<UserExpense[]>>(UninitializedData);

  const searchBus = usePersistentMemo(() => new B.Bus<ExpenseQuery>(), []);
  const repeatSearchBus = usePersistentMemo(() => new B.Bus<true>(), []);

  log(`Param year`, match.params.year, `month`, match.params.month);

  // We can't use React.useEffect() here because it is run too late
  // (after initial render, and after the query view submits the query).
  // Thus, use this custom hook instead. It will run the setup code during the first
  // render (and unsubscribe when this component unmounts).
  useWhenMounted(() => {
    const resultsE = searchBus
      .sampledBy(B.mergeAll<any>(searchBus, repeatSearchBus))
      .flatMapLatest(query =>
        isEmptyQuery(query)
          ? B.once([])
          : B.fromPromise(
              apiConnect.searchExpenses({
                includeSubCategories: true,
                ...query,
              })
            )
      );
    const unsubs = [
      resultsE.onValue(value => setResults({ type: 'loaded', value })),
      resultsE.onError(error => setResults({ type: 'error', error })),
    ];
    return () => unsubs.forEach(u => u());
  }, [searchBus, repeatSearchBus, setResults]);

  const onSearch = React.useCallback(
    (query: ExpenseQuery) => {
      log('Searching for', query);
      setResults({ type: 'loading' });
      navigationBus.push({
        pathPrefix: searchPagePath,
        dateRange: toDateRange(
          query.startDate ?? new Date(),
          query.endDate ?? new Date()
        ),
      });
      searchBus.push(query);
    },
    [setResults, searchBus]
  );

  const onRepeatSearch = React.useCallback(() => {
    log('Repeating search');
    repeatSearchBus.push(true);
  }, [repeatSearchBus]);

  const queryRef = React.useRef<QueryView>(null);

  const onAddCategoryToSearch = React.useCallback(
    (cat: Category) => queryRef.current?.addCategory(cat),
    [queryRef]
  );

  React.useEffect(() => needUpdateE.onValue(onRepeatSearch), [onRepeatSearch]);

  return (
    <PageContentContainer>
      <QueryView
        ref={queryRef}
        categoryMap={userData.categoryMap}
        categorySource={categorySource}
        onSearch={onSearch}
        isSearching={results.type === 'loading'}
        user={session.user}
        {...match.params}
      />
      <ResultsView
        results={results.type === 'loaded' ? results.value : []}
        onUpdate={onRepeatSearch}
        onSelectCategory={onAddCategoryToSearch}
      />
    </PageContentContainer>
  );
};

export const SearchView = connect(
  B.combineTemplate({
    session: validSessionE,
    userData: userDataE,
    categorySource: categoryDataSourceP,
  })
)(SearchViewImpl);
