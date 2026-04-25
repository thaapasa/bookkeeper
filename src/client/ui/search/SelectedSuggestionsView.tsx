import { Group } from '@mantine/core';
import * as React from 'react';

import { Tag } from '../component/Tag';
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
        <Tag
          key={c.id}
          variant={c.type === 'receiver' ? 'primary' : 'default'}
          onRemove={() => onRemove(c)}
        >
          {getSearchSuggestionValue(c)}
        </Tag>
      ))}
    </Group>
  );
};
