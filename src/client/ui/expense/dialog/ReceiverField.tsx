import * as B from 'baconjs';
import * as React from 'react';

import { identity } from 'shared/util';
import apiConnect from 'client/data/ApiConnect';
import { AutoComplete, AutoCompletePassthroughProps } from 'client/ui/component/AutoComplete';
import { usePersistentMemo } from 'client/ui/hooks/usePersistentMemo.ts';

export type ReceiverFieldProps = {
  value: string;
  title?: string;
  onChange: (event: string) => void;
} & AutoCompletePassthroughProps;

export const ReceiverField: React.FC<React.PropsWithChildren<ReceiverFieldProps>> = ({
  onChange,
  title,
  value,
  ...props
}) => {
  const searchStream = usePersistentMemo(() => new B.Bus<string>(), []);

  const [receivers, setReceivers] = React.useState<string[]>([]);

  // Update upstream props when searching
  React.useEffect(() => searchStream.onValue(onChange), [searchStream, onChange]);

  // Load receivers when search input changes
  React.useEffect(
    () =>
      searchStream
        .filter(v => (v && v.length > 2) || false)
        .debounceImmediate(500)
        .flatMapLatest(v => B.fromPromise(apiConnect.queryReceivers(v)))
        .onValue(setReceivers),
    [searchStream, setReceivers],
  );

  // Clear receiver list when search string is too short
  React.useEffect(
    () => searchStream.filter(v => !v || v.length < 3).onValue(() => setReceivers([])),
    [searchStream, setReceivers],
  );

  const updateReceivers = React.useCallback(
    (search: string) => searchStream.push(search),
    [searchStream],
  );

  return (
    <AutoComplete
      value={value}
      onChange={onChange}
      label={title}
      suggestions={receivers}
      onUpdateSuggestions={updateReceivers}
      onSelectSuggestion={onChange}
      getSuggestionValue={identity}
      autoHideErrorText={true}
      {...props}
    />
  );
};
