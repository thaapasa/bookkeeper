import { Group, Pill } from '@mantine/core';
import * as React from 'react';

import { getSearchSuggestionValue, SearchSuggestion } from './SearchSuggestions';

export const SelectedSuggestionsView: React.FC<{
  suggestions: SearchSuggestion[];
  onRemove: (s: SearchSuggestion) => void;
}> = ({ suggestions, onRemove }) => {
  if (suggestions.length < 1) {
    return null;
  }
  return (
    <Group gap="xs">
      {suggestions.map(c => (
        <Pill
          key={c.id}
          bg={c.type === 'receiver' ? 'primary.2' : undefined}
          withRemoveButton
          onRemove={() => onRemove(c)}
        >
          {getSearchSuggestionValue(c)}
        </Pill>
      ))}
    </Group>
  );
};
