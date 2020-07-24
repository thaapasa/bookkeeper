import * as React from 'react';
import * as B from 'baconjs';
import debug from 'debug';
import { Session, Category } from 'shared/types/Session';
import { connect } from '../component/BaconConnect';
import {
  userDataE,
  UserDataProps,
  categoryDataSourceP,
  CategoryDataSource,
} from 'client/data/Categories';
import { validSessionE } from 'client/data/Login';
import { PageContentContainer } from '../Styles';
import { QueryView } from './QueryView';
import { ExpenseQuery, UserExpense } from 'shared/types/Expense';
import apiConnect from 'client/data/ApiConnect';
import { unsubscribeAll, Unsubscriber } from 'client/util/ClientUtil';
import { ResultsView } from './ResultsView';
import { needUpdateE } from 'client/data/State';

const log = debug('bookkeeper:expense-search');

interface SearchViewProps {
  userData: UserDataProps;
  session: Session;
  categorySource: CategoryDataSource[];
}

interface SearchViewState {
  isSearching: boolean;
  results: UserExpense[];
  query?: ExpenseQuery;
}

function isEmptyQuery(q: ExpenseQuery) {
  const hasCategory =
    typeof q.categoryId === 'number' ||
    (typeof q.categoryId === 'object' && q.categoryId.length > 0);
  return !q.search && !hasCategory && !q.receiver;
}

class SearchView extends React.Component<SearchViewProps, SearchViewState> {
  public state: SearchViewState = {
    isSearching: false,
    results: [],
  };

  private searchBus = new B.Bus<ExpenseQuery>();
  private repeatSearchBus = new B.Bus<true>();
  private unsub: Unsubscriber[] = [];
  private queryRef = React.createRef<QueryView>();

  componentDidMount() {
    const resultsE = this.searchBus
      .sampledBy(B.mergeAll<any>(this.searchBus, this.repeatSearchBus))
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
    this.unsub.push(resultsE.onValue(this.onResults));
    this.unsub.push(resultsE.onError(this.onError));
    this.unsub.push(needUpdateE.onValue(this.onRepeatSearch));
  }

  componentWillUnmount() {
    unsubscribeAll(this.unsub);
  }

  public render() {
    return (
      <PageContentContainer>
        <QueryView
          ref={this.queryRef}
          categoryMap={this.props.userData.categoryMap}
          categorySource={this.props.categorySource}
          onSearch={this.onSearch}
          isSearching={this.state.isSearching}
          user={this.props.session.user}
        />
        <ResultsView
          results={this.state.results}
          onUpdate={this.onRepeatSearch}
          onSelectCategory={this.onAddCategoryToSearch}
        />
      </PageContentContainer>
    );
  }

  private onRepeatSearch = () => {
    log('Repeating search');
    this.repeatSearchBus.push(true);
  };

  private onSearch = (query: ExpenseQuery) => {
    log('Searching for', query);
    this.setState({ isSearching: true });
    this.searchBus.push(query);
  };

  private onAddCategoryToSearch = (cat: Category) => {
    if (this.queryRef.current) {
      this.queryRef.current.addCategory(cat);
    }
  };

  private onResults = (results: UserExpense[]) => {
    log('Received results', results);
    this.setState({ results, isSearching: false });
  };

  private onError = (error: any) => {
    log('Got error from search:', error);
    this.setState({ results: [], isSearching: false });
  };
}

export default connect(
  B.combineTemplate({
    session: validSessionE,
    userData: userDataE,
    categorySource: categoryDataSourceP,
  })
)(SearchView);
