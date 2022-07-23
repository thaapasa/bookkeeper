import * as React from 'react';

import { last } from 'shared/util/Arrays';
import { filterMapCaseInsensitive } from 'shared/util/Util';
import { CategoryDataSource } from 'client/data/Categories';

import AutoComplete from '../../component/AutoComplete';

interface TitleFieldState {
  suggestions: CategoryDataSource[];
}

function dsToString(ds: CategoryDataSource) {
  return ds.text;
}

export class TitleField extends React.Component<
  {
    id: string;
    value: string;
    errorText?: string;
    dataSource: CategoryDataSource[];
    onChange: (s: string | React.ChangeEvent<{ value: string }>) => void;
    onSelect: (s: number) => void;
  },
  TitleFieldState
> {
  state: TitleFieldState = { suggestions: [] };

  render() {
    return (
      <AutoComplete
        id={this.props.id}
        value={this.props.value}
        onChange={this.props.onChange}
        onUpdateSuggestions={this.updateSuggestions}
        onClearSuggestions={this.clearSuggestions}
        onSelectSuggestion={this.selectCategory}
        getSuggestionValue={dsToString}
        placeholder="Ruokaostokset"
        label="Kuvaus"
        errorText={this.props.errorText}
        fullWidth={true}
        suggestions={this.state.suggestions}
      />
    );
  }

  selectCategory = (c: CategoryDataSource) => {
    if (c) {
      this.props.onSelect(c.value);
      this.props.onChange(last((c.text || '').split('-')).trim());
    }
  };

  updateSuggestions = (search: string) =>
    this.setState({
      suggestions: filterMapCaseInsensitive(
        search,
        this.props.dataSource,
        dsToString
      ),
    });

  clearSuggestions = () => this.setState({ suggestions: [] });
}
