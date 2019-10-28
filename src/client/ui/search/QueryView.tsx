import * as React from 'react';
import styled from 'styled-components';
import * as B from 'baconjs';
import { Category } from '../../../shared/types/Session';
import AutoComplete from '../component/AutoComplete';
import { eventValue } from '../../util/ClientUtil';
import { CircularProgress } from '@material-ui/core';

interface QueryViewProps {
  categories: Category[];
  onSearch: (query: string) => void;
  isSearching: boolean;
}

interface QueryViewState {
  input: string;
  categorySuggestions: Category[];
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
  private inputStream = new B.Bus<string>();

  componentDidMount() {
    this.inputStream.onValue(input => this.setState({ input }));
    this.inputStream.debounce(300).onValue(this.doSearch);
  }

  render() {
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
      </QueryArea>
    );
  }

  private doSearch = (input: string) => {
    this.props.onSearch(input);
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
    this.inputStream.push(eventValue(e));
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
