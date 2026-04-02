import { ActionIcon, Button, Checkbox, Grid, Group, Loader } from '@mantine/core';
import * as React from 'react';

import { toDateRangeName, TypedDateRange } from 'shared/time';
import { isDefined, ObjectId } from 'shared/types';
import { CategoryDataSource } from 'client/data/Categories';
import { validSessionP } from 'client/data/Login';

import { DateRangeSelector } from '../component/daterange/DateRangeSelector';
import { UserSelector } from '../component/UserSelector';
import { useBaconState } from '../hooks/useBaconState';
import { Icons } from '../icons/Icons';
import styles from './QuerySearchLayout.module.css';
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
  onToggleUnconfirmed: (_event: unknown, checked: boolean) => void;
  dateRange?: TypedDateRange;
  onSelectRange: (r?: TypedDateRange) => void;
  onSaveAsReport: () => void;
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
  userId,
  onSetUserId,
  unconfirmed,
  onToggleUnconfirmed,
  dateRange,
  onSelectRange,
  onSaveAsReport,
}) => {
  const session = useBaconState(validSessionP);
  if (!session) return null;
  return (
    <Grid p="md" gutter="md">
      <Grid.Col span={{ base: 12, sm: 7 }}>
        <Group wrap="nowrap">
          <div className={styles.clearIcon}>
            <ActionIcon size="sm" onClick={onClear}>
              <Icons.Delete />
            </ActionIcon>
          </div>
          <SearchInputField
            value={input}
            onChange={onChange}
            selectSuggestion={selectSuggestion}
            startSearch={startSearch}
            categorySource={categorySource}
          />
          <div className={styles.searchButton}>
            <ActionIcon size="sm" onClick={startSearch}>
              <Icons.Search color="primary" />
            </ActionIcon>
          </div>
          <div className={styles.progressArea}>{isSearching ? <Loader size={38} /> : null}</div>
        </Group>
        <br />
        {dateRange ? `Haetaan ajalta ${toDateRangeName(dateRange)}` : 'Ei aikaehtoja'}
      </Grid.Col>
      <Grid.Col span={{ base: 12, sm: 3 }}>
        <DateRangeSelector dateRange={dateRange} onSelectRange={onSelectRange} />
      </Grid.Col>
      <Grid.Col span={{ base: 12, sm: 2 }}>
        <Group>
          <Checkbox
            checked={isDefined(userId)}
            onChange={() => onSetUserId(isDefined(userId) ? undefined : session.user.id)}
            label="Vain omat"
            styles={{ label: { fontSize: 'var(--mantine-font-size-sm)' } }}
          />
          {isDefined(userId) ? (
            <UserSelector
              singleSelection
              selected={[userId]}
              onChange={([id]) => onSetUserId(id)}
              size={32}
            />
          ) : null}
        </Group>
        <Checkbox
          checked={unconfirmed}
          onChange={e => onToggleUnconfirmed(e, e.currentTarget.checked)}
          label="Alustavat"
          styles={{ label: { fontSize: 'var(--mantine-font-size-sm)' } }}
        />
        <Button variant="subtle" onClick={onSaveAsReport}>
          Tee raportti
        </Button>
      </Grid.Col>
      <Grid.Col span={12}>
        <SelectedSuggestionsView suggestions={selectedSuggestions} onRemove={removeSuggestion} />
      </Grid.Col>
    </Grid>
  );
};
