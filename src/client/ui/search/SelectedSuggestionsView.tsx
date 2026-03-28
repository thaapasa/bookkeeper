import styled from '@emotion/styled';
import { Pill } from '@mantine/core';
import * as React from 'react';

import { primary } from '../Colors';
import { getSearchSuggestionValue, SearchSuggestion } from './SearchSuggestions';

export const SelectedSuggestionsView: React.FC<{
  suggestions: SearchSuggestion[];
  onRemove: (s: SearchSuggestion) => void;
}> = ({ suggestions, onRemove }) => {
  if (suggestions.length < 1) {
    return null;
  }
  return (
    <>
      {suggestions.map(c => (
        <SuggestionPill key={c.id} className={c.type} withRemoveButton onRemove={() => onRemove(c)}>
          {getSearchSuggestionValue(c)}
        </SuggestionPill>
      ))}
    </>
  );
};

const SuggestionPill = styled(Pill)`
  margin: 0 4px;
  &:first-of-type {
    margin-left: 0;
  }
  &:last-of-type {
    margin-right: 0;
  }
  &.receiver {
    background-color: ${primary[2]};
  }
` as any;
