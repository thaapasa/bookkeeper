import * as React from 'react';
import styled from 'styled-components';
import * as B from 'baconjs';
import { CircularProgress, Chip } from '@material-ui/core';
import { Category } from '../../../shared/types/Session';
import AutoComplete from '../component/AutoComplete';
import { eventValue } from '../../util/ClientUtil';
import { ExpenseQuery } from '../../../shared/types/Expense';
import { DateRangeSelector } from '../component/daterange/DateRangeSelector';
import {
  TypedDateRange,
  toDateRangeName,
  toISODate,
} from '../../../shared/util/Time';
import { unnest } from '../../../shared/util/Arrays';

interface QueryViewProps {
  categories: Category[];
  onSearch: (query: ExpenseQuery) => void;
  isSearching: boolean;
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
  };
  private inputBus = new B.Bus<string>();
  private dateRangeBus = new B.Bus<TypedDateRange | undefined>();
  private categoriesBus = new B.Bus<number[]>();
  private receiverBus = new B.Bus<string | undefined>();

  componentDidMount() {
    this.inputBus.onValue(input => this.setState({ input }));
    this.dateRangeBus.onValue(dateRange => this.setState({ dateRange }));
    B.combineTemplate({
      search: this.inputBus.debounce(300).toProperty(''),
      receiver: this.receiverBus.toProperty(undefined),
      dateRange: this.dateRangeBus.toProperty(undefined),
      categoryId: this.categoriesBus.toProperty([]),
    }).onValue(v =>
      this.doSearch({
        search: v.search,
        receiver: v.receiver,
        startDate: v.dateRange && toISODate(v.dateRange.start),
        endDate: v.dateRange && toISODate(v.dateRange.end),
        categoryId: v.categoryId,
      })
    );
  }

  addCategory = (category: Category) => {
    this.selectSuggestion({ type: 'category', category, id: category.id });
  };

  render() {
    return (
      <QueryArea>
        <Block>
          <Row>
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
            />
            <ProgressArea>
              {this.props.isSearching ? <CircularProgress size={28} /> : null}
            </ProgressArea>
          </Row>
          <Row>
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
          />
        ))}
      </Row>
    );
  }

  private doSearch = (query: ExpenseQuery) => {
    this.props.onSearch(query);
  };

  private clearSuggestions = () => this.setState({ suggestions: [] });
  private getSuggestionValue = (suggestion: Suggestion) =>
    suggestion.type === 'category'
      ? suggestion.category.name
      : suggestion.receiver;

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

  private onChange = (e: string | React.ChangeEvent<{ value: string }>) =>
    this.inputBus.push(eventValue(e));

  private selectDateRange = (dateRange?: TypedDateRange) =>
    this.dateRangeBus.push(dateRange);
}

const QueryArea = styled.div`
  margin: 24px 24px 0 24px;
  display: grid;
  grid-template-columns: 1fr 1fr;
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
`;

const ProgressArea = styled.div`
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
`;
