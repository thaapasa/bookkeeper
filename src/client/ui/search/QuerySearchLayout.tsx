import {
  Checkbox,
  CircularProgress,
  FormControlLabel,
  Grid,
  IconButton,
} from '@mui/material';
import * as React from 'react';
import styled from 'styled-components';

import { toDateRangeName, TypedDateRange } from 'shared/time';
import { CategoryDataSource } from 'client/data/Categories';

import { gray } from '../Colors';
import { FlexRow } from '../component/BasicElements';
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
  <Grid container padding="16px" rowGap="16px">
    <Grid item md={7} xs={12} sm={12}>
      <FlexRow>
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
      </FlexRow>
      <br />
      {dateRange
        ? `Haetaan ajalta ${toDateRangeName(dateRange)}`
        : 'Ei aikaehtoja'}
    </Grid>
    <Grid item md={3} sm={7} xs={12}>
      <DateRangeSelector dateRange={dateRange} onSelectRange={onSelectRange} />
    </Grid>
    <Grid item md={2} sm={5} xs={12}>
      <CheckLabel
        control={
          <Checkbox checked={ownExpenses} onChange={onToggleOwnExpenses} />
        }
        label="Vain omat"
      />
    </Grid>
    <Grid item xs={12}>
      <SelectedSuggestionsView
        suggestions={selectedSuggestions}
        onRemove={removeSuggestion}
      />
    </Grid>
  </Grid>
);

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
