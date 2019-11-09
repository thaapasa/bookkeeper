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

interface QueryViewState {
  input: string;
  categorySuggestions: Category[];
  dateRange?: TypedDateRange;
  selectedCategories: Category[];
}

function getCategorySuggestions(
  categories: Category[],
  input: string
): Category[] {
  if (!input || input.length < 1) {
    return [];
  }
  const lowerInput = input.toLowerCase();
  const filter = (c: Category) => c.name.toLowerCase().includes(lowerInput);
  return [
    ...categories.filter(filter),
    ...unnest(categories.map(c => c.children)).filter(filter),
  ];
}

export class QueryView extends React.Component<QueryViewProps, QueryViewState> {
  public state: QueryViewState = {
    input: '',
    categorySuggestions: [],
    selectedCategories: [],
  };
  private inputBus = new B.Bus<string>();
  private dateRangeBus = new B.Bus<TypedDateRange | undefined>();
  private categoriesBus = new B.Bus<number[]>();

  componentDidMount() {
    this.inputBus.onValue(input => this.setState({ input }));
    this.dateRangeBus.onValue(dateRange => this.setState({ dateRange }));
    B.combineTemplate({
      search: this.inputBus.debounce(300).toProperty(''),
      dateRange: this.dateRangeBus.toProperty(undefined),
      categoryId: this.categoriesBus.toProperty([]),
    }).onValue(v =>
      this.doSearch({
        search: v.search,
        startDate: v.dateRange && toISODate(v.dateRange.start),
        endDate: v.dateRange && toISODate(v.dateRange.end),
        categoryId: v.categoryId,
      })
    );
  }

  addCategory = (cat: Category) => {
    this.selectSuggestion(cat);
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
    if (this.state.selectedCategories.length < 1) {
      return null;
    }
    return (
      <Row className="top-margin">
        {this.state.selectedCategories.map(c => (
          <Suggestion
            key={c.id}
            label={c.name}
            onDelete={() => this.removeCategory(c)}
          />
        ))}
      </Row>
    );
  }

  private doSearch = (query: ExpenseQuery) => {
    this.props.onSearch(query);
  };

  private clearSuggestions = () => this.setState({ categorySuggestions: [] });
  private getSuggestionValue = (suggestion: Category) => suggestion.name;
  private selectSuggestion = (suggestion: Category) => {
    this.setState(
      s => ({
        selectedCategories: [...s.selectedCategories, suggestion],
      }),
      () =>
        this.categoriesBus.push(this.state.selectedCategories.map(c => c.id))
    );
    this.inputBus.push('');
  };
  private removeCategory = (cat: Category) => {
    this.setState(
      s => ({
        selectedCategories: s.selectedCategories.filter(c => c.id !== cat.id),
      }),
      () =>
        this.categoriesBus.push(this.state.selectedCategories.map(c => c.id))
    );
  };

  private updateSuggestions = (search: string) => {
    this.setState({
      categorySuggestions: getCategorySuggestions(
        this.props.categories,
        search
      ),
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
