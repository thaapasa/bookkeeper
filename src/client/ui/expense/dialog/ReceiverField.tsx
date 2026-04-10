import * as React from 'react';

import { identity } from 'shared/util';
import apiConnect from 'client/data/ApiConnect';
import { AutoComplete, AutoCompletePassthroughProps } from 'client/ui/component/AutoComplete';

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
  const [receivers, setReceivers] = React.useState<string[]>([]);
  const timerRef = React.useRef<ReturnType<typeof setTimeout>>(undefined);
  const abortRef = React.useRef<AbortController>(undefined);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      clearTimeout(timerRef.current);
      abortRef.current?.abort();
    };
  }, []);

  const updateReceivers = React.useCallback(
    (search: string) => {
      onChange(search);
      clearTimeout(timerRef.current);
      abortRef.current?.abort();

      if (!search || search.length < 3) {
        setReceivers([]);
        return;
      }

      timerRef.current = setTimeout(async () => {
        const controller = new AbortController();
        abortRef.current = controller;
        try {
          const results = await apiConnect.queryReceivers(search);
          if (!controller.signal.aborted) {
            setReceivers(results);
          }
        } catch {
          // Swallow errors from aborted requests
        }
      }, 500);
    },
    [onChange],
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
