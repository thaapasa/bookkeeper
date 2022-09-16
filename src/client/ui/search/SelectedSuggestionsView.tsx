import { Chip } from '@mui/material';
import * as React from 'react';
import styled from 'styled-components';

import { Row } from '../category/CategoryTableLayout';
import { secondaryColors } from '../Colors';
import { getSearchSuggestionValue, SearchSuggestion } from './SearchInputField';

export const SelectedSuggestionsView: React.FC<{
  suggestions: SearchSuggestion[];
  onRemove: (s: SearchSuggestion) => void;
}> = ({ suggestions, onRemove }) => {
  if (suggestions.length < 1) {
    return null;
  }
  return (
    <Row className="top-margin">
      {suggestions.map(c => (
        <Suggestion
          key={c.id}
          label={getSearchSuggestionValue(c)}
          onDelete={() => onRemove(c)}
          className={c.type}
        />
      ))}
    </Row>
  );
};

const Suggestion = styled(Chip)`
  margin: 0 4px;
  &:first-of-type {
    margin-left: 0;
  }
  &:last-of-type {
    margin-right: 0;
  }
  &.receiver {
    background-color: ${secondaryColors.light};
  }
`;
