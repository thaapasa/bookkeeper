import * as B from 'baconjs';
import * as React from 'react';

import { identity } from 'shared/util/Util';
import apiConnect from 'client/data/ApiConnect';
import { AutoComplete } from 'client/ui/component/AutoComplete';
import { usePersistentMemo } from 'client/ui/hooks/usePersistentMemo';

export interface ReceiverFieldProps {
  id: string;
  value: string;
  title: string;
  fullWidth?: boolean;
  placeholder?: string;
  errorText?: string;
  autoFocus?: boolean;
  onChange: (event: string | React.ChangeEvent<{ value: string }>) => void;
  onBlur?: () => void;
  onKeyUp?: (event: React.KeyboardEvent<any>) => void;
}

export const ReceiverField: React.FC<
  React.PropsWithChildren<ReceiverFieldProps>
> = ({ onChange, title, value, ...props }) => {
  const searchStream = usePersistentMemo(() => new B.Bus<string>(), []);

  const [receivers, setReceivers] = React.useState<string[]>([]);

  // Update upstream props when searching
  React.useEffect(
    () => searchStream.onValue(onChange),
    [searchStream, onChange]
  );

  // Load receivers when search input changes
  React.useEffect(
    () =>
      searchStream
        .filter(v => (v && v.length > 2) || false)
        .debounceImmediate(500)
        .flatMapLatest(v => B.fromPromise(apiConnect.queryReceivers(v)))
        .onValue(setReceivers),
    [searchStream, setReceivers]
  );

  // Clear receiver list when search string is too short
  React.useEffect(
    () =>
      searchStream
        .filter(v => !v || v.length < 3)
        .onValue(() => setReceivers([])),
    [searchStream, setReceivers]
  );

  const updateReceivers = React.useCallback(
    (search: string) => searchStream.push(search),
    [searchStream]
  );

  const selectReceiver = onChange;

  return (
    <AutoComplete
      value={value}
      onChange={onChange}
      label={title}
      suggestions={receivers}
      onUpdateSuggestions={updateReceivers}
      onSelectSuggestion={selectReceiver}
      getSuggestionValue={identity}
      {...props}
    />
  );
};

export class PlainReceiverField extends React.Component<
  React.PropsWithChildren<ReceiverFieldProps>
> {
  public render() {
    return (
      <ReceiverField {...this.props} value={this.props.value || ''}>
        {this.props.children}
      </ReceiverField>
    );
  }
}
