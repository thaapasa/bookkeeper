import * as React from 'react';
import styled from 'styled-components';
import * as B from 'baconjs';
import { Category } from '../../../shared/types/Session';
import AutoComplete from '../component/AutoComplete';
import { eventValue } from '../../util/ClientUtil';
import { CircularProgress } from '@material-ui/core';
import { ExpenseQuery } from 'shared/types/Expense';
import { DateRangeSelector } from './DateRangeSelector';
import { TypedDateRange, toDateRangeName } from 'shared/util/Time';

interface QueryViewProps {
  categories: Category[];
  onSearch: (query: ExpenseQuery) => void;
  isSearching: boolean;
}

interface QueryViewState {
  input: string;
  categorySuggestions: Category[];
  dateRange?: TypedDateRange;
}

function getCategorySuggestions(
  categories: Category[],
  input: string
): Category[] {
  if (!input || input.length < 1) {
    return [];
  }
  const lowerInput = input.toLowerCase();
  return categories.filter(c => c.name.toLowerCase().includes(lowerInput));
}

export class QueryView extends React.Component<QueryViewProps, QueryViewState> {
  public state: QueryViewState = { input: '', categorySuggestions: [] };
  private inputBus = new B.Bus<string>();
  private dateRangeBus = new B.Bus<TypedDateRange | undefined>();

  componentDidMount() {
    this.inputBus.onValue(input => this.setState({ input }));
    this.dateRangeBus.onValue(dateRange => this.setState({ dateRange }));
    B.combineTemplate({
      search: this.inputBus.debounce(300),
      dateRange: this.dateRangeBus.toProperty(undefined),
    }).onValue(v => this.doSearch(v));
  }

  render() {
    console.log('Rendering query view with range', this.state.dateRange);
    return (
      <QueryArea>
        <Row>
          <AutoComplete
            id="search-terms"
            label="Hakuehdot"
            value={this.state.input}
            onChange={this.onChange}
            fullWidth={true}
            suggestions={this.state.categorySuggestions}
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
        <DateRangeSelector
          dateRange={this.state.dateRange}
          onSelectRange={this.selectDateRange}
        />
      </QueryArea>
    );
  }

  private doSearch = (query: ExpenseQuery) => {
    this.props.onSearch(query);
  };

  private clearSuggestions = () => this.setState({ categorySuggestions: [] });
  private getSuggestionValue = (suggestion: Category) => suggestion.name;
  private selectSuggestion = (suggestion: Category) => {
    this.setState({ input: suggestion.name });
  };

  private updateSuggestions = (search: string) => {
    console.log('Update suggestions', search);
    this.setState({
      categorySuggestions: getCategorySuggestions(
        this.props.categories,
        search
      ),
    });
  };

  private onChange = (e: string | React.ChangeEvent<{ value: string }>) =>
    this.inputBus.push(eventValue(e));

  private selectDateRange = (dateRange?: TypedDateRange) => {
    console.log('Set search range', dateRange);
    this.setState({ dateRange });
  };
}

const QueryArea = styled.div`
  width: 480px;
  margin: 24px 24px 0 24px;
`;

const ProgressArea = styled.div`
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Row = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
`;
