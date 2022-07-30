import * as B from 'baconjs';
import debug from 'debug';
import * as React from 'react';

import { ExpenseQuery, UserExpense } from 'shared/types/Expense';
import { Category, Session } from 'shared/types/Session';
import apiConnect from 'client/data/ApiConnect';
import { AsyncData, UnitializedData } from 'client/data/AsyncData';
import {
  CategoryDataSource,
  categoryDataSourceP,
  userDataE,
  UserDataProps,
} from 'client/data/Categories';
import { validSessionE } from 'client/data/Login';

import { connect } from '../component/BaconConnect';
import { PageContentContainer } from '../Styles';
import { usePersistentMemo } from '../utils/usePersistentMemo';
import { useWhenMounted } from '../utils/useWhenMounted';
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

const SearchView: React.FC<SearchViewProps> = ({
  userData,
  session,
  categorySource,
}) => {
  const [results, setResults] =
    React.useState<AsyncData<UserExpense[]>>(UnitializedData);

  log('Current results', results);

  const searchBus = usePersistentMemo(() => new B.Bus<ExpenseQuery>(), []);
  const repeatSearchBus = usePersistentMemo(() => new B.Bus<true>(), []);

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

  return (
    <PageContentContainer>
      <QueryView
        ref={queryRef}
        categoryMap={userData.categoryMap}
        categorySource={categorySource}
        onSearch={onSearch}
        isSearching={results.type === 'loading'}
        user={session.user}
      />
      <ResultsView
        results={results.type === 'loaded' ? results.value : []}
        onUpdate={onRepeatSearch}
        onSelectCategory={onAddCategoryToSearch}
      />
    </PageContentContainer>
  );
};

export default connect(
  B.combineTemplate({
    session: validSessionE,
    userData: userDataE,
    categorySource: categoryDataSourceP,
  })
)(SearchView);
