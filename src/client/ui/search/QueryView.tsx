import * as B from 'baconjs';
import * as React from 'react';

import { ExpenseQuery } from 'shared/expense';
import { parseQueryString } from 'shared/net';
import { toISODate, toMoment, TypedDateRange } from 'shared/time';
import { Category, User } from 'shared/types';
import {
  CategoryDataSource,
  getFullCategoryName,
} from 'client/data/Categories';
import { eventValue } from 'client/util/ClientUtil';

import { parseMonthRange, toYearRange } from '../component/daterange/Common';
import { QuerySearchLayout } from './QuerySearchLayout';
import {
  isReceiverSuggestion,
  isSameSuggestion,
  SearchSuggestion,
} from './SearchSuggestions';

interface QueryViewProps {
  categorySource: CategoryDataSource[];
  categoryMap: Record<string, Category>;
  onSearch: (query: ExpenseQuery) => void;
  isSearching: boolean;
  user: User;
  year?: string;
  month?: string;
}

interface QueryViewState {
  input: string;
  dateRange?: TypedDateRange;
  selectedSuggestions: SearchSuggestion[];
  ownExpenses: boolean;
}

export class QueryView extends React.Component<QueryViewProps, QueryViewState> {
  public state: QueryViewState = {
    input: '',
    selectedSuggestions: [],
    dateRange: toYearRange(toMoment().year()),
    ownExpenses: false,
  };
  private inputBus = new B.Bus<string>();
  private dateRangeBus = new B.Bus<TypedDateRange | undefined>();
  private categoriesBus = new B.Bus<number[]>();
  private receiverBus = new B.Bus<string | undefined>();
  private executeSearchBus = new B.Bus<void>();
  private ownExpensesBus = new B.Bus<boolean>();

  componentDidMount() {
    this.inputBus.onValue(input => this.setState({ input }));
    this.dateRangeBus.onValue(dateRange => this.setState({ dateRange }));
    this.ownExpensesBus.onValue(ownExpenses => this.setState({ ownExpenses }));
    const searchTriggers = B.mergeAll<any>(
      this.executeSearchBus,
      this.receiverBus,
      this.dateRangeBus,
      this.categoriesBus,
      this.ownExpensesBus
    );
    const searchData = B.combineTemplate({
      search: this.inputBus.toProperty(''),
      receiver: this.receiverBus.toProperty(undefined),
      dateRange: this.dateRangeBus.toProperty(undefined),
      categoryId: this.categoriesBus.toProperty([]),
      ownExpenses: this.ownExpensesBus.toProperty(false),
    });
    searchData.sampledBy(searchTriggers).onValue(v =>
      this.doSearch({
        search: v.search,
        receiver: v.receiver,
        startDate: v.dateRange && toISODate(v.dateRange.start),
        endDate: v.dateRange && toISODate(v.dateRange.end),
        categoryId: v.categoryId,
        userId: v.ownExpenses ? this.props.user.id : undefined,
      })
    );

    const params = parseQueryString(document.location.search);
    if (params && params.hae) {
      this.inputBus.push(params.hae);
    }
    if (params && params.kaikki) {
      setImmediate(() => this.selectDateRange(undefined));
    } else {
      if (this.props.month) {
        const r = parseMonthRange(this.props.month);
        setImmediate(() => this.selectDateRange(r));
      }
      if (this.props.year) {
        const r = toYearRange(this.props.year);
        setImmediate(() => this.selectDateRange(r));
      }
    }
  }

  componentDidUpdate(prevProps: QueryViewProps) {
    if (this.props.month && prevProps.month !== this.props.month) {
      this.selectDateRange(parseMonthRange(this.props.month));
    }
    if (this.props.year && prevProps.year !== this.props.year) {
      this.selectDateRange(toYearRange(this.props.year));
    }
  }

  addCategory = (category: Category) => {
    this.selectSuggestion({
      type: 'category',
      id: category.id,
      name: getFullCategoryName(category.id, this.props.categoryMap),
    });
  };

  render() {
    return (
      <QuerySearchLayout
        onClear={this.onClear}
        input={this.state.input}
        onChange={this.onChange}
        selectSuggestion={this.selectSuggestion}
        startSearch={this.startSearch}
        categorySource={this.props.categorySource}
        isSearching={this.props.isSearching}
        ownExpenses={this.state.ownExpenses}
        onToggleOwnExpenses={this.onToggleOwnExpenses}
        selectedSuggestions={this.state.selectedSuggestions}
        removeSuggestion={this.removeSelection}
        dateRange={this.state.dateRange}
        onSelectRange={this.selectDateRange}
      />
    );
  }

  private startSearch = () => this.executeSearchBus.push();

  private doSearch = (query: ExpenseQuery) => {
    this.props.onSearch(query);
  };

  private selectSuggestion = (suggestion: SearchSuggestion) => {
    this.setState(
      s => ({
        selectedSuggestions: [
          ...(suggestion.type === 'receiver'
            ? s.selectedSuggestions.filter(s => s.type !== 'receiver')
            : s.selectedSuggestions),
          suggestion,
        ],
      }),
      this.pushSelections
    );
    this.inputBus.push('');
  };

  private removeSelection = (suggestion: SearchSuggestion) => {
    this.setState(
      s => ({
        selectedSuggestions: s.selectedSuggestions.filter(
          c => !isSameSuggestion(c, suggestion)
        ),
      }),
      this.pushSelections
    );
  };

  private pushSelections = () => {
    this.categoriesBus.push(
      this.state.selectedSuggestions
        .filter(s => s.type === 'category')
        .map(c => c.id)
    );
    const receiver = this.state.selectedSuggestions.find(isReceiverSuggestion);
    this.receiverBus.push(receiver ? receiver.receiver : undefined);
  };

  private onToggleOwnExpenses = (_event: any, checked: boolean) =>
    this.ownExpensesBus.push(checked);

  private onChange = (e: string | React.ChangeEvent<{ value: string }>) =>
    this.inputBus.push(eventValue(e));

  private onClear = () => {
    this.inputBus.push('');
  };

  private selectDateRange = (dateRange?: TypedDateRange) =>
    this.dateRangeBus.push(dateRange);
}
