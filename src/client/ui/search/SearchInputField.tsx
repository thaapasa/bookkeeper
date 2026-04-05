import * as React from 'react';

import { IdProvider } from 'shared/util';
import { CategoryDataSource } from 'client/data/Categories';

import { AutoComplete, AutoCompletePassthroughProps } from '../component/AutoComplete';
import {
  CategorySuggestion,
  getSearchSuggestionValue,
  ReceiverSuggestion,
  SearchSuggestion,
} from './SearchSuggestions';

type SearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  selectSuggestion: (s: SearchSuggestion) => void;
  startSearch: () => void;
  categorySource: CategoryDataSource[];
} & AutoCompletePassthroughProps;

const receiverId = new IdProvider();

export const SearchInputField: React.FC<SearchInputProps> = ({
  value,
  onChange,
  selectSuggestion,
  startSearch,
  categorySource,
  ...props
}) => {
  const [suggestions, setSuggestions] = React.useState<SearchSuggestion[]>([]);
  const onInputKeyUp = React.useCallback(
    (event: React.KeyboardEvent<any>) => {
      if (event.key === 'Enter') {
        startSearch();
      }
    },
    [startSearch],
  );

  const updateSuggestions = React.useCallback(
    (search: string) => {
      const receiverSuggestions: ReceiverSuggestion[] = search
        ? [{ type: 'receiver', receiver: search, id: receiverId.next() }]
        : [];
      setSuggestions([...receiverSuggestions, ...getCategorySuggestions(categorySource, search)]);
    },
    [setSuggestions, categorySource],
  );

  return (
    <AutoComplete<SearchSuggestion>
      mt="xs"
      label="Hakuehdot"
      value={value}
      onChange={onChange}
      fullWidth={true}
      suggestions={suggestions}
      onUpdateSuggestions={updateSuggestions}
      onSelectSuggestion={selectSuggestion}
      getSuggestionValue={getSearchSuggestionValue}
      inputClassName="pad-left"
      autoHideErrorText={true}
      onKeyUp={onInputKeyUp}
      {...props}
    />
  );
};

function getCategorySuggestions(
  categorySource: CategoryDataSource[],
  input: string,
): CategorySuggestion[] {
  if (!input || input.length < 1) {
    return [];
  }
  const lowerInput = input.toLowerCase();
  const filter = (c: CategoryDataSource) => c.text.toLowerCase().includes(lowerInput);
  return categorySource.filter(filter).map(c => ({ type: 'category', id: c.value, name: c.text }));
}
