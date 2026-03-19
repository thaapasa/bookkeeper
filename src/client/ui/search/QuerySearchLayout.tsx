import styled from '@emotion/styled';
import { ActionIcon, Button, Checkbox, Loader } from '@mantine/core';
import * as B from 'baconjs';
import * as React from 'react';

import { toDateRangeName, TypedDateRange } from 'shared/time';
import { isDefined, ObjectId, Session } from 'shared/types';
import { CategoryDataSource } from 'client/data/Categories';
import { validSessionP } from 'client/data/Login';

import { gray } from '../Colors';
import { connect } from '../component/BaconConnect';
import { FlexRow } from '../component/BasicElements';
import { DateRangeSelector } from '../component/daterange/DateRangeSelector';
import { Row } from '../component/Row';
import UserSelector from '../component/UserSelector';
import { Icons } from '../icons/Icons';
import { media } from '../Styles';
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
  userId: ObjectId | undefined;
  onSetUserId: (userId: ObjectId | undefined) => void;
  unconfirmed: boolean;
  onToggleUnconfirmed: (_event: any, checked: boolean) => void;
  dateRange?: TypedDateRange;
  onSelectRange: (r?: TypedDateRange) => void;
  onSaveAsReport: () => void;
  session: Session;
}

const QuerySearchLayoutImpl: React.FC<QuerySearchLayoutProps> = ({
  onClear,
  input,
  onChange,
  startSearch,
  selectSuggestion,
  selectedSuggestions,
  removeSuggestion,
  categorySource,
  isSearching,
  userId,
  onSetUserId,
  unconfirmed,
  onToggleUnconfirmed,
  dateRange,
  onSelectRange,
  onSaveAsReport,
  session,
}) => (
  <SearchGrid>
    <div>
      <FlexRow>
        <ClearIconArea>
          <ActionIcon variant="subtle" size="sm" onClick={onClear}>
            <Icons.Delete />
          </ActionIcon>
        </ClearIconArea>
        <SearchInputField
          value={input}
          onChange={onChange}
          selectSuggestion={selectSuggestion}
          startSearch={startSearch}
          categorySource={categorySource}
        />
        <SearchButtonArea>
          <ActionIcon variant="subtle" size="sm" onClick={startSearch}>
            <Icons.Search color="primary" />
          </ActionIcon>
        </SearchButtonArea>
        <ProgressArea>
          {isSearching ? <Loader size={38} /> : null}
        </ProgressArea>
      </FlexRow>
      <br />
      {dateRange ? `Haetaan ajalta ${toDateRangeName(dateRange)}` : 'Ei aikaehtoja'}
    </div>
    <div>
      <DateRangeSelector dateRange={dateRange} onSelectRange={onSelectRange} />
    </div>
    <div>
      <Row>
        <Checkbox
          checked={isDefined(userId)}
          onChange={() => onSetUserId(isDefined(userId) ? undefined : session.user.id)}
          label="Vain omat"
          styles={{ label: { fontSize: 13 } }}
        />
        {isDefined(userId) ? (
          <UserSelector
            singleSelection
            selected={[userId]}
            onChange={([id]) => onSetUserId(id)}
            size={32}
          />
        ) : null}
      </Row>
      <Checkbox
        checked={unconfirmed}
        onChange={e => onToggleUnconfirmed(e, e.currentTarget.checked)}
        label="Alustavat"
        styles={{ label: { fontSize: 13 } }}
      />
      <Button variant="subtle" onClick={onSaveAsReport}>Tee raportti</Button>
    </div>
    <div style={{ gridColumn: '1 / -1' }}>
      <SelectedSuggestionsView suggestions={selectedSuggestions} onRemove={removeSuggestion} />
    </div>
  </SearchGrid>
);

export const QuerySearchLayout = connect(
  B.combineTemplate({
    session: validSessionP,
  }),
)(QuerySearchLayoutImpl);

const SearchGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  padding: 16px;
  gap: 16px;
  ${media.web`grid-template-columns: 7fr 3fr 2fr;`}
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

const ProgressArea = styled.div`
  width: 64px;
  height: 48px;
  margin-right: 8px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
`;
