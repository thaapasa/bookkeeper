import * as React from 'react';
import styled from 'styled-components';
import * as B from 'baconjs';
import {
  CircularProgress,
  Chip,
  IconButton,
  Checkbox,
  FormControlLabel,
} from '@material-ui/core';
import { Category, User } from '../../../shared/types/Session';
import AutoComplete from '../component/AutoComplete';
import { eventValue } from '../../util/ClientUtil';
import { ExpenseQuery } from '../../../shared/types/Expense';
import { parseQueryString } from '../../util/UrlUtils';
import { DateRangeSelector } from '../component/daterange/DateRangeSelector';
import {
  TypedDateRange,
  toDateRangeName,
  toISODate,
  toMoment,
} from '../../../shared/util/Time';
import { unnest } from '../../../shared/util/Arrays';
import { secondaryColors, gray } from '../Colors';
import { Search, Delete } from '../Icons';
import { KeyCodes } from 'client/util/Io';
import { toYearRange } from '../component/daterange/Common';

interface QueryViewProps {
  categories: Category[];
  onSearch: (query: ExpenseQuery) => void;
  isSearching: boolean;
  user: User;
}

interface CategorySuggestion {
  id: number;
  type: 'category';
  category: Category;
}

interface ReceiverSuggestion {
  id: number;
  type: 'receiver';
  receiver: string;
}

function isReceiverSuggestion(x: Suggestion): x is ReceiverSuggestion {
  return x.type === 'receiver';
}

type Suggestion = CategorySuggestion | ReceiverSuggestion;

function isSameSuggestion(s1: Suggestion, s2: Suggestion) {
  return s1.type === s2.type && s1.id === s2.id;
}

let receiverId = 1;

interface QueryViewState {
  input: string;
  suggestions: Suggestion[];
  dateRange?: TypedDateRange;
  selectedSuggestions: Suggestion[];
  ownExpenses: boolean;
}

function getCategorySuggestions(
  categories: Category[],
  input: string
): CategorySuggestion[] {
  if (!input || input.length < 1) {
    return [];
  }
  const lowerInput = input.toLowerCase();
  const filter = (c: Category) => c.name.toLowerCase().includes(lowerInput);
  return [
    ...categories.filter(filter),
    ...unnest(categories.map(c => c.children)).filter(filter),
  ].map(category => ({ type: 'category', category, id: category.id }));
}

export class QueryView extends React.Component<QueryViewProps, QueryViewState> {
  public state: QueryViewState = {
    input: '',
    suggestions: [],
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
      setImmediate(() => this.dateRangeBus.push(undefined));
    }
  }

  addCategory = (category: Category) => {
    this.selectSuggestion({ type: 'category', category, id: category.id });
  };

  render() {
    return (
      <QueryArea>
        <Block>
          <Row>
            <ClearIconArea>
              <IconButton size="small" onClick={this.onClear}>
                <Delete />
              </IconButton>
            </ClearIconArea>
            <AutoComplete
              id="search-terms"
              label="Hakuehdot"
              value={this.state.input}
              onChange={this.onChange}
              fullWidth={true}
              suggestions={this.state.suggestions}
              onUpdateSuggestions={this.updateSuggestions}
              onSelectSuggestion={this.selectSuggestion}
              getSuggestionValue={this.getSuggestionValue}
              onClearSuggestions={this.clearSuggestions}
              inputClassName="pad-left"
              onKeyUp={this.onInputKeyUp}
            />
            <SearchButtonArea>
              <IconButton size="small" onClick={this.startSearch}>
                <Search color="primary" />
              </IconButton>
            </SearchButtonArea>
            <ProgressArea>
              {this.props.isSearching ? (
                <CircularProgress
                  size={38}
                  variant="indeterminate"
                  disableShrink
                />
              ) : null}
            </ProgressArea>
          </Row>
          <Row>
            <CheckLabel
              control={
                <Checkbox
                  value="foo"
                  checked={this.state.ownExpenses}
                  onChange={this.onToggleOwnExpenses}
                />
              }
              label="Vain omat"
            />
            {this.state.dateRange
              ? `Haetaan ajalta ${toDateRangeName(this.state.dateRange)}`
              : 'Ei aikaehtoja'}
          </Row>
          {this.renderSelections()}
        </Block>
        <Block>
          <DateRangeSelector
            dateRange={this.state.dateRange}
            onSelectRange={this.selectDateRange}
          />
        </Block>
      </QueryArea>
    );
  }

  private renderSelections() {
    if (this.state.selectedSuggestions.length < 1) {
      return null;
    }
    return (
      <Row className="top-margin">
        {this.state.selectedSuggestions.map(c => (
          <Suggestion
            key={c.id}
            label={this.getSuggestionValue(c)}
            onDelete={() => this.removeSelection(c)}
            className={c.type}
          />
        ))}
      </Row>
    );
  }

  private startSearch = () => this.executeSearchBus.push();

  private doSearch = (query: ExpenseQuery) => {
    this.props.onSearch(query);
  };

  private onInputKeyUp = (event: React.KeyboardEvent<any>) => {
    if (event.keyCode === KeyCodes.enter) {
      this.startSearch();
    }
  };

  private clearSuggestions = () => this.setState({ suggestions: [] });
  private getSuggestionValue = (suggestion: Suggestion) =>
    suggestion.type === 'category'
      ? suggestion.category.name
      : `Kohde: ${suggestion.receiver}`;

  private selectSuggestion = (suggestion: Suggestion) => {
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

  private removeSelection = (suggestion: Suggestion) => {
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

  private updateSuggestions = (search: string) => {
    const receiverSuggestions: ReceiverSuggestion[] = search
      ? [{ type: 'receiver', receiver: search, id: receiverId++ }]
      : [];
    this.setState({
      suggestions: [
        ...receiverSuggestions,
        ...getCategorySuggestions(this.props.categories, search),
      ],
    });
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

const QueryArea = styled.div`
  margin: 24px 24px 0 24px;
  display: grid;
  grid-template-columns: 1fr 1fr;
`;

const SearchToolArea = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 46px;
  background-color: #f7f7f7;
  border: 1px solid ${gray.standard};
  border-bottom: 1px solid ${gray.dark};
  border-radius: 4px;
`;

const ClearIconArea = styled(SearchToolArea)`
  border-right: none;
  border-bottom-right-radius: 0;
  border-top-right-radius: 0;
`;

const SearchButtonArea = styled(SearchToolArea)`
  width: 50px;
  border-left: none;
  border-bottom-left-radius: 0;
  border-top-left-radius: 0;
`;

const Block = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 96px;
`;

const Row = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;

  &.top-margin {
    margin-top: 8px;
  }
`;

const Suggestion = styled(Chip)`
  margin: 0 4px;
  &:first-of-type {
    margin-left: 0;
  }
  &:last-of-type {
    margin-right: 0;
  }
  &.receiver {
    background-color: ${secondaryColors.light};
  }
`;

const ProgressArea = styled.div`
  width: 64px;
  height: 48px;
  margin-right: 8px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
`;

const CheckLabel = styled(FormControlLabel)`
  & span {
    font-size: 13px;
  }
`;
