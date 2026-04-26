import { ActionIcon, BoxProps, Checkbox, Grid, Group, Loader, Stack } from '@mantine/core';
import * as React from 'react';

import { toDateRangeName, TypedDateRange } from 'shared/time';
import { isDefined, ObjectId } from 'shared/types';
import { CategoryDataSource } from 'client/data/Categories';
import { useValidSession } from 'client/data/SessionStore';

import { DateRangeSelector } from '../component/daterange/DateRangeSelector';
import { UserSelector } from '../component/UserSelector';
import { Icons } from '../icons/Icons';
import { SearchInputField } from './SearchInputField';
import { SearchSuggestion } from './SearchSuggestions';
import { SelectedSuggestionsView } from './SelectedSuggestionsView';

interface QuerySearchLayoutProps extends BoxProps {
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
  ...props
}) => {
  const session = useValidSession();
  return (
    <Grid gap="md" {...props}>
      <Grid.Col span={{ base: 12, sm: 7 }}>
        <Group wrap="nowrap">
          <SearchInputField
            value={input}
            onChange={onChange}
            selectSuggestion={selectSuggestion}
            startSearch={startSearch}
            categorySource={categorySource}
            leftSection={
              <ActionIcon size="sm" onClick={onClear}>
                <Icons.Delete />
              </ActionIcon>
            }
            rightSection={
              isSearching ? (
                <Loader size={16} />
              ) : (
                <ActionIcon size="sm" onClick={startSearch}>
                  <Icons.Search color="primary" />
                </ActionIcon>
              )
            }
          />
        </Group>
        <br />
        {dateRange ? `Haetaan ajalta ${toDateRangeName(dateRange)}` : 'Ei aikaehtoja'}
      </Grid.Col>
      <Grid.Col span={{ base: 12, sm: 3 }}>
        <DateRangeSelector dateRange={dateRange} onSelectRange={onSelectRange} />
      </Grid.Col>
      <Grid.Col span={{ base: 12, sm: 2 }}>
        <Stack>
          <Group align="center" h={32}>
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
            h={32}
            checked={unconfirmed}
            onChange={e => onToggleUnconfirmed(e, e.currentTarget.checked)}
            label="Alustavat"
            styles={{ label: { fontSize: 'var(--mantine-font-size-sm)' } }}
          />
        </Stack>
      </Grid.Col>
      <Grid.Col span={12}>
        <SelectedSuggestionsView suggestions={selectedSuggestions} onRemove={removeSuggestion} />
      </Grid.Col>
    </Grid>
  );
};
