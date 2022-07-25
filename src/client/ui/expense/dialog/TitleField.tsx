import * as React from 'react';

import { last } from 'shared/util/Arrays';
import { filterMapCaseInsensitive } from 'shared/util/Util';
import { CategoryDataSource } from 'client/data/Categories';
import { AutoComplete } from 'client/ui/component/AutoComplete';

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
    onChange: (s: string) => void;
    onSelect: (s: number) => void;
  },
  TitleFieldState
> {
  state: TitleFieldState = { suggestions: [] };

  render() {
    return (
      <AutoComplete
        value={this.props.value}
        onChange={this.props.onChange}
        onUpdateSuggestions={this.updateSuggestions}
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
}
