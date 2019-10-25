import * as React from 'react';
import styled from 'styled-components';
import * as B from 'baconjs';
import { Category } from 'shared/types/Session';
import AutoComplete from '../component/AutoComplete';
import { eventValue } from 'client/util/ClientUtil';

interface QueryViewProps {
  categories: Category[];
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
    // this.inputStream.debounce(300).onValue(this.updateSuggestions);
  }

  render() {
    return (
      <QueryArea>
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
      </QueryArea>
    );
  }

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
`;
