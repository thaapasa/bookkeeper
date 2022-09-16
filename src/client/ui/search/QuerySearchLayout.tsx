import {
  Checkbox,
  CircularProgress,
  FormControlLabel,
  IconButton,
} from '@mui/material';
import * as React from 'react';
import styled from 'styled-components';

import { toDateRangeName, TypedDateRange } from 'shared/time';
import { CategoryDataSource } from 'client/data/Categories';

import { gray } from '../Colors';
import { DateRangeSelector } from '../component/daterange/DateRangeSelector';
import { Icons } from '../icons/Icons';
import { SearchInputField } from './SearchInputField';
import { SearchSuggestion } from './SearchSuggestions';
import { SelectedSuggestionsView } from './SelectedSuggestionsView';

interface QuerySearchLayoutProps {
  onClear: () => void;
  input: string;
  onChange: (s: string) => void;
  categorySource: CategoryDataSource[];
  startSearch: () => void;
  selectedSuggestions: SearchSuggestion[];
  selectSuggestion: (suggestion: SearchSuggestion) => void;
  removeSuggestion: (suggestion: SearchSuggestion) => void;
  isSearching: boolean;
  ownExpenses: boolean;
  onToggleOwnExpenses: (_event: any, checked: boolean) => void;
  dateRange?: TypedDateRange;
  onSelectRange: (r?: TypedDateRange) => void;
}

export const QuerySearchLayout: React.FC<QuerySearchLayoutProps> = ({
  onClear,
  input,
  onChange,
  startSearch,
  selectSuggestion,
  selectedSuggestions,
  removeSuggestion,
  categorySource,
  isSearching,
  ownExpenses,
  onToggleOwnExpenses,
  dateRange,
  onSelectRange,
}) => (
  <QueryArea>
    <Block>
      <Row className="top-align">
        <ClearIconArea>
          <IconButton size="small" onClick={onClear}>
            <Icons.Delete />
          </IconButton>
        </ClearIconArea>
        <SearchInputField
          value={input}
          onChange={onChange}
          selectSuggestion={selectSuggestion}
          startSearch={startSearch}
          categorySource={categorySource}
        />
        <SearchButtonArea>
          <IconButton size="small" onClick={startSearch}>
            <Icons.Search color="primary" />
          </IconButton>
        </SearchButtonArea>
        <ProgressArea>
          {isSearching ? (
            <CircularProgress size={38} variant="indeterminate" disableShrink />
          ) : null}
        </ProgressArea>
      </Row>
      <Row>
        <CheckLabel
          control={
            <Checkbox checked={ownExpenses} onChange={onToggleOwnExpenses} />
          }
          label="Vain omat"
        />
        {dateRange
          ? `Haetaan ajalta ${toDateRangeName(dateRange)}`
          : 'Ei aikaehtoja'}
      </Row>
      <SelectedSuggestionsView
        suggestions={selectedSuggestions}
        onRemove={removeSuggestion}
      />
    </Block>
    <Block>
      <DateRangeSelector dateRange={dateRange} onSelectRange={onSelectRange} />
    </Block>
  </QueryArea>
);

const QueryArea = styled.div`
  margin: 24px 24px 0 24px;
  display: grid;
  grid-template-columns: 1fr 1fr;
`;

const SearchToolArea = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  margin-top: 6px;
  width: 40px;
  height: 46px;
  background-color: #f7f7f7;
  border: 1px solid ${gray.standard};
  border-bottom: 1px solid ${gray.dark};
  border-radius: 4px;
`;

const ClearIconArea = styled(SearchToolArea)`
  border-right: none;
  border-bottom-right-radius: 0;
  border-top-right-radius: 0;
`;

const SearchButtonArea = styled(SearchToolArea)`
  width: 50px;
  border-left: none;
  border-bottom-left-radius: 0;
  border-top-left-radius: 0;
`;

const Block = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 96px;
`;

const Row = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;

  &.top-margin {
    margin-top: 8px;
  }
  &.top-align {
    align-items: flex-start;
  }
`;

const ProgressArea = styled.div`
  width: 64px;
  height: 48px;
  margin-right: 8px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
`;

const CheckLabel = styled(FormControlLabel)`
  & span {
    font-size: 13px;
  }
`;
