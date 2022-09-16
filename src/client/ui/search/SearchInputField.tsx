import * as React from 'react';
import styled from 'styled-components';

import { IdProvider } from 'shared/util';
import { CategoryDataSource } from 'client/data/Categories';
import { KeyCodes } from 'client/util/Io';

import { AutoComplete } from '../component/AutoComplete';

interface CategorySuggestion {
  id: number;
  type: 'category';
  name: string;
}

interface ReceiverSuggestion {
  id: number;
  type: 'receiver';
  receiver: string;
}

type Suggestion = CategorySuggestion | ReceiverSuggestion;

type SearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  selectSuggestion: (s: Suggestion) => void;
  startSearch: () => void;
  categorySource: CategoryDataSource[];
};

const receiverId = new IdProvider();

export const SearchInputField: React.FC<SearchInputProps> = ({
  value,
  onChange,
  selectSuggestion,
  startSearch,
  categorySource,
}) => {
  const [suggestions, setSuggestions] = React.useState<Suggestion[]>([]);
  const onInputKeyUp = React.useCallback(
    (event: React.KeyboardEvent<any>) => {
      if (event.keyCode === KeyCodes.enter) {
        startSearch();
      }
    },
    [startSearch]
  );

  const updateSuggestions = React.useCallback(
    (search: string) => {
      const receiverSuggestions: ReceiverSuggestion[] = search
        ? [{ type: 'receiver', receiver: search, id: receiverId.next() }]
        : [];
      setSuggestions([
        ...receiverSuggestions,
        ...getCategorySuggestions(categorySource, search),
      ]);
    },
    [setSuggestions, categorySource]
  );

  return (
    <StyledComplete
      id="search-terms"
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
    />
  );
};

function getCategorySuggestions(
  categorySource: CategoryDataSource[],
  input: string
): CategorySuggestion[] {
  if (!input || input.length < 1) {
    return [];
  }
  const lowerInput = input.toLowerCase();
  const filter = (c: CategoryDataSource) =>
    c.text.toLowerCase().includes(lowerInput);
  return categorySource
    .filter(filter)
    .map(c => ({ type: 'category', id: c.value, name: c.text }));
}

export function getSearchSuggestionValue(suggestion: Suggestion) {
  return suggestion.type === 'category'
    ? suggestion.name
    : `Kohde: ${suggestion.receiver}`;
}

const StyledComplete = styled(AutoComplete)`
  margin-top: 6px;
`;
