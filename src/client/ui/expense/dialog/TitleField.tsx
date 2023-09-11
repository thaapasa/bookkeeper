import * as React from 'react';

import { filterMapCaseInsensitive, last } from 'shared/util';
import { CategoryDataSource } from 'client/data/Categories';
import { AutoComplete } from 'client/ui/component/AutoComplete';

interface TitleFieldProps {
  id: string;
  value: string;
  errorText?: string;
  dataSource: CategoryDataSource[];
  onChange: (s: string) => void;
  onSelect: (s: number) => void;
}

export const TitleField: React.FC<TitleFieldProps> = ({ value, errorText, dataSource, onChange, onSelect }) => {
  const [suggestions, setSuggestions] = React.useState<CategoryDataSource[]>([]);

  const selectCategory = React.useCallback(
    (c: CategoryDataSource) => {
      if (c) {
        onSelect(c.value);
        onChange(last((c.text || '').split('-')).trim());
      }
    },
    [onSelect, onChange],
  );

  const updateSuggestions = React.useCallback(
    (search: string) => setSuggestions(filterMapCaseInsensitive(search, dataSource, dsToString)),
    [setSuggestions, dataSource],
  );

  return (
    <AutoComplete
      value={value}
      onChange={onChange}
      onUpdateSuggestions={updateSuggestions}
      onSelectSuggestion={selectCategory}
      getSuggestionValue={dsToString}
      placeholder="Ruokaostokset"
      label="Kuvaus"
      errorText={errorText}
      fullWidth={true}
      suggestions={suggestions}
    />
  );
};

const dsToString = (ds: CategoryDataSource) => ds.text;
