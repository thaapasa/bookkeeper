import { BoxProps } from '@mantine/core';
import * as React from 'react';

import { ExpenseQuery } from 'shared/expense';
import { parseQueryString } from 'shared/net';
import { ISOMonth, toDateTime, TypedDateRange } from 'shared/time';
import { Category, CategoryMap, ObjectId } from 'shared/types';
import { CategoryDataSource, getFullCategoryName } from 'client/data/Categories';

import { parseMonthRange, toYearRange } from '../component/daterange/dateRangeUtils';
import { requestSaveReport } from '../reports/ReportUtils';
import { QuerySearchLayout } from './QuerySearchLayout';
import { isReceiverSuggestion, isSameSuggestion, SearchSuggestion } from './SearchSuggestions';

interface QueryViewProps extends BoxProps {
  categorySource: CategoryDataSource[];
  categoryMap: CategoryMap;
  onSearch: (query: ExpenseQuery) => void;
  isSearching: boolean;
  year?: string;
  month?: ISOMonth;
}

export interface QueryViewHandle {
  addCategory: (category: Category) => void;
}

export const QueryView = React.forwardRef<QueryViewHandle, QueryViewProps>(
  ({ categorySource, categoryMap, onSearch, isSearching, year, month, ...props }, ref) => {
    const [input, setInput] = React.useState('');
    const [dateRange, setDateRange] = React.useState<TypedDateRange | undefined>(
      toYearRange(toDateTime().year),
    );
    const [selectedSuggestions, setSelectedSuggestions] = React.useState<SearchSuggestion[]>([]);
    const [userId, setUserId] = React.useState<ObjectId | undefined>(undefined);
    const [unconfirmed, setUnconfirmed] = React.useState(false);

    // Use refs so buildQuery always reads current state (needed for immediate trigger after setState)
    const inputRef = React.useRef(input);
    inputRef.current = input;
    const dateRangeRef = React.useRef(dateRange);
    dateRangeRef.current = dateRange;
    const suggestionsRef = React.useRef(selectedSuggestions);
    suggestionsRef.current = selectedSuggestions;
    const userIdRef = React.useRef(userId);
    userIdRef.current = userId;
    const unconfirmedRef = React.useRef(unconfirmed);
    unconfirmedRef.current = unconfirmed;

    const buildQuery = React.useCallback((): ExpenseQuery => {
      const categoryIds = suggestionsRef.current.filter(s => s.type === 'category').map(c => c.id);
      const receiver = suggestionsRef.current.find(isReceiverSuggestion)?.receiver;
      return {
        search: inputRef.current || undefined,
        receiver: receiver || undefined,
        startDate: dateRangeRef.current?.start,
        endDate: dateRangeRef.current?.end,
        categoryId: categoryIds,
        userId: userIdRef.current,
        confirmed: unconfirmedRef.current ? false : undefined,
        includeSubCategories: true,
      };
    }, []);

    const startSearch = React.useCallback(() => {
      onSearch(buildQuery());
    }, [onSearch, buildQuery]);

    const saveAsReport = React.useCallback(() => {
      requestSaveReport(buildQuery());
    }, [buildQuery]);

    // Auto-trigger search when filters change (not on text input changes)
    const isInitializedRef = React.useRef(false);
    React.useEffect(() => {
      if (!isInitializedRef.current) return;
      onSearch(buildQuery());
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dateRange, selectedSuggestions, userId, unconfirmed]);

    // Initialize from URL params on mount
    React.useEffect(() => {
      const params = parseQueryString(document.location.search);
      if (params?.hae) {
        setInput(params.hae);
      }
      if (params?.kaikki) {
        setDateRange(undefined);
      } else {
        if (month) {
          setDateRange(parseMonthRange(month));
        }
        if (year) {
          setDateRange(toYearRange(year));
        }
      }
      isInitializedRef.current = true;
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Handle month/year prop changes
    React.useEffect(() => {
      if (month) {
        setDateRange(parseMonthRange(month));
      }
    }, [month]);

    React.useEffect(() => {
      if (year) {
        setDateRange(toYearRange(year));
      }
    }, [year]);

    const selectSuggestion = React.useCallback((suggestion: SearchSuggestion) => {
      setSelectedSuggestions(prev => {
        const next = [
          ...(suggestion.type === 'receiver' ? prev.filter(s => s.type !== 'receiver') : prev),
          suggestion,
        ];
        suggestionsRef.current = next;
        return next;
      });
      setInput('');
    }, []);

    const removeSuggestion = React.useCallback((suggestion: SearchSuggestion) => {
      setSelectedSuggestions(prev => {
        const next = prev.filter(c => !isSameSuggestion(c, suggestion));
        suggestionsRef.current = next;
        return next;
      });
    }, []);

    const addCategory = React.useCallback(
      (category: Category) => {
        selectSuggestion({
          type: 'category',
          id: category.id,
          name: getFullCategoryName(category.id, categoryMap),
        });
      },
      [selectSuggestion, categoryMap],
    );

    React.useImperativeHandle(ref, () => ({ addCategory }), [addCategory]);

    return (
      <QuerySearchLayout
        onClear={() => setInput('')}
        input={input}
        onChange={(e: string | React.ChangeEvent<{ value: string }>) =>
          setInput(typeof e === 'string' ? e : e.target.value)
        }
        selectSuggestion={selectSuggestion}
        startSearch={startSearch}
        categorySource={categorySource}
        isSearching={isSearching}
        userId={userId}
        onSetUserId={setUserId}
        unconfirmed={unconfirmed}
        onToggleUnconfirmed={(_event: unknown, checked: boolean) => setUnconfirmed(checked)}
        selectedSuggestions={selectedSuggestions}
        removeSuggestion={removeSuggestion}
        dateRange={dateRange}
        onSelectRange={setDateRange}
        onSaveAsReport={saveAsReport}
        {...props}
      />
    );
  },
);

QueryView.displayName = 'QueryView';
