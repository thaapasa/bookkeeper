import * as React from 'react';
import * as B from 'baconjs';
import debug from 'debug';
import { Session } from '../../../shared/types/Session';
import { connect } from '../component/BaconConnect';
import { userDataE, UserDataProps } from '../../data/Categories';
import { validSessionE } from '../../data/Login';
import { PageContentContainer } from '../Styles';
import { QueryView } from './QueryView';
import { ExpenseQuery, UserExpense } from '../../../shared/types/Expense';
import apiConnect from '../../data/ApiConnect';
import { unsubscribeAll, Unsubscriber } from '../../util/ClientUtil';
import { ResultsView } from './ResultsView';
import { noop } from '../../../shared/util/Util';
import { TypedDateRange } from 'shared/util/Time';

const log = debug('bookkeeper:expense-search');

interface SearchViewProps {
  userData: UserDataProps;
  session: Session;
}

interface SearchViewState {
  isSearching: boolean;
  results: UserExpense[];
  dateRange?: TypedDateRange;
}

function isEmptyQuery(q: ExpenseQuery) {
  return !q.search && !q.categoryId && !q.receiver;
}

class SearchView extends React.Component<SearchViewProps, SearchViewState> {
  public state: SearchViewState = {
    isSearching: false,
    results: [],
  };

  private searchBus = new B.Bus<ExpenseQuery>();
  private unsub: Unsubscriber[] = [];

  componentDidMount() {
    const resultsE = this.searchBus.flatMapLatest(q =>
      isEmptyQuery(q) ? B.once([]) : B.fromPromise(apiConnect.searchExpenses(q))
    );
    this.unsub.push(resultsE.onValue(this.onResults));
    this.unsub.push(resultsE.onError(this.onError));
  }

  componentWillUnmount() {
    unsubscribeAll(this.unsub);
  }

  public render() {
    return (
      <PageContentContainer>
        <QueryView
          categories={this.props.session.categories}
          onSearch={this.onSearch}
          isSearching={this.state.isSearching}
        />
        <ResultsView results={this.state.results} onUpdate={noop} />
      </PageContentContainer>
    );
  }

  private onSearch = (query: ExpenseQuery) => {
    log('Searching for', query);
    this.setState({ isSearching: true });
    this.searchBus.push(query);
  };

  private onResults = (results: UserExpense[]) => {
    log('Received results', results);
    this.setState({ isSearching: false, results });
  };

  private onError = (error: any) => {
    log('Got error from search:', error);
    this.setState({ isSearching: false, results: [] });
  };
}

export default connect(
  B.combineTemplate({ session: validSessionE, userData: userDataE })
)(SearchView);
