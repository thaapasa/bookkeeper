import * as B from 'baconjs';
import * as React from 'react';

import { ExpenseQuery } from 'shared/expense';
import { parseQueryString } from 'shared/net';
import { ISOMonth, toDateTime, toISODate, TypedDateRange } from 'shared/time';
import { Category, CategoryMap, ObjectId } from 'shared/types';
import { CategoryDataSource, getFullCategoryName } from 'client/data/Categories';
import { eventValue } from 'client/util/ClientUtil';

import { parseMonthRange, toYearRange } from '../component/daterange/dateRangeUtils';
import { usePersistentMemo } from '../hooks/usePersistentMemo';
import { requestSaveReport } from '../reports/ReportUtils';
import { QuerySearchLayout } from './QuerySearchLayout';
import { isReceiverSuggestion, isSameSuggestion, SearchSuggestion } from './SearchSuggestions';

interface QueryViewProps {
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
  ({ categorySource, categoryMap, onSearch, isSearching, year, month }, ref) => {
    const [input, setInput] = React.useState('');
    const [dateRange, setDateRange] = React.useState<TypedDateRange | undefined>(
      toYearRange(toDateTime().year),
    );
    const [selectedSuggestions, setSelectedSuggestions] = React.useState<SearchSuggestion[]>([]);
    const [userId, setUserId] = React.useState<ObjectId | undefined>(undefined);
    const [unconfirmed, setUnconfirmed] = React.useState(false);

    const inputBus = usePersistentMemo(() => new B.Bus<string>(), []);
    const dateRangeBus = usePersistentMemo(() => new B.Bus<TypedDateRange | undefined>(), []);
    const categoriesBus = usePersistentMemo(() => new B.Bus<number[]>(), []);
    const receiverBus = usePersistentMemo(() => new B.Bus<string | undefined>(), []);
    const executeSearchBus = usePersistentMemo(() => new B.Bus<void>(), []);
    const userIdBus = usePersistentMemo(() => new B.Bus<ObjectId | undefined>(), []);
    const unconfirmedBus = usePersistentMemo(() => new B.Bus<boolean>(), []);
    const saveReportBus = usePersistentMemo(() => new B.Bus<void>(), []);

    // Keep a ref to selectedSuggestions for pushSelections callback
    const suggestionsRef = React.useRef(selectedSuggestions);
    suggestionsRef.current = selectedSuggestions;

    const pushSelections = React.useCallback(() => {
      categoriesBus.push(suggestionsRef.current.filter(s => s.type === 'category').map(c => c.id));
      const receiver = suggestionsRef.current.find(isReceiverSuggestion);
      receiverBus.push(receiver ? receiver.receiver : undefined);
    }, [categoriesBus, receiverBus]);

    const selectSuggestion = React.useCallback(
      (suggestion: SearchSuggestion) => {
        setSelectedSuggestions(prev => {
          const next = [
            ...(suggestion.type === 'receiver' ? prev.filter(s => s.type !== 'receiver') : prev),
            suggestion,
          ];
          // Update ref immediately so pushSelections sees the new value
          suggestionsRef.current = next;
          return next;
        });
        pushSelections();
        inputBus.push('');
      },
      [pushSelections, inputBus],
    );

    const removeSuggestion = React.useCallback(
      (suggestion: SearchSuggestion) => {
        setSelectedSuggestions(prev => {
          const next = prev.filter(c => !isSameSuggestion(c, suggestion));
          suggestionsRef.current = next;
          return next;
        });
        pushSelections();
      },
      [pushSelections],
    );

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

    // Set up Bacon.js reactive search pipeline
    React.useEffect(() => {
      const unsubs = [
        inputBus.onValue(setInput),
        dateRangeBus.onValue(setDateRange),
        userIdBus.onValue(setUserId),
        unconfirmedBus.onValue(setUnconfirmed),
      ];

      const searchTriggers = B.mergeAll<unknown>(
        executeSearchBus,
        receiverBus,
        dateRangeBus,
        categoriesBus,
        userIdBus,
        unconfirmedBus,
      );
      const searchData = B.combineTemplate({
        search: inputBus.toProperty(''),
        receiver: receiverBus.toProperty(undefined),
        dateRange: dateRangeBus.toProperty(undefined),
        categoryId: categoriesBus.toProperty([]),
        userId: userIdBus.toProperty(undefined),
        unconfirmed: unconfirmedBus.toProperty(false),
      }).map(v => ({
        search: v.search || undefined,
        receiver: v.receiver || undefined,
        startDate: v.dateRange && toISODate(v.dateRange.start),
        endDate: v.dateRange && toISODate(v.dateRange.end),
        categoryId: v.categoryId,
        userId: v.userId,
        confirmed: v.unconfirmed ? false : undefined,
        includeSubCategories: true,
      }));

      unsubs.push(searchData.sampledBy(searchTriggers).onValue(onSearch));
      unsubs.push(searchData.sampledBy(saveReportBus).onValue(requestSaveReport));

      const params = parseQueryString(document.location.search);
      if (params?.hae) {
        inputBus.push(params.hae);
      }
      if (params?.kaikki) {
        setImmediate(() => dateRangeBus.push(undefined));
      } else {
        if (month) {
          const r = parseMonthRange(month);
          setImmediate(() => dateRangeBus.push(r));
        }
        if (year) {
          const r = toYearRange(year);
          setImmediate(() => dateRangeBus.push(r));
        }
      }

      return () => unsubs.forEach(u => u());
      // Only run on mount
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Handle month/year prop changes
    React.useEffect(() => {
      if (month) {
        dateRangeBus.push(parseMonthRange(month));
      }
    }, [month, dateRangeBus]);

    React.useEffect(() => {
      if (year) {
        dateRangeBus.push(toYearRange(year));
      }
    }, [year, dateRangeBus]);

    return (
      <QuerySearchLayout
        onClear={() => inputBus.push('')}
        input={input}
        onChange={(e: string | React.ChangeEvent<{ value: string }>) =>
          inputBus.push(eventValue(e))
        }
        selectSuggestion={selectSuggestion}
        startSearch={() => executeSearchBus.push()}
        categorySource={categorySource}
        isSearching={isSearching}
        userId={userId}
        onSetUserId={(id: ObjectId | undefined) => userIdBus.push(id)}
        unconfirmed={unconfirmed}
        onToggleUnconfirmed={(_event: unknown, checked: boolean) => unconfirmedBus.push(checked)}
        selectedSuggestions={selectedSuggestions}
        removeSuggestion={removeSuggestion}
        dateRange={dateRange}
        onSelectRange={(r?: TypedDateRange) => dateRangeBus.push(r)}
        onSaveAsReport={() => saveReportBus.push()}
      />
    );
  },
);

QueryView.displayName = 'QueryView';
