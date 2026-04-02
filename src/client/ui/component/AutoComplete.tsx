import {
  ActionIcon,
  Autocomplete as MantineAutocomplete,
  AutocompleteProps as MantineAutocompleteProps,
  BoxProps,
  MantineStyleProp,
} from '@mantine/core';
import React from 'react';

import { logger } from 'client/Logger';

import { Icons } from '../icons/Icons';

export type AutoCompletePassthroughProps = {
  id?: string;
  value: string;
  fullWidth?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
  label?: string;
  errorText?: string;
  onKeyUp?: (event: React.KeyboardEvent<any>) => void;
  onAdd?: () => void;
  className?: string;
  inputClassName?: string;
} & BoxProps &
  Pick<MantineAutocompleteProps, 'leftSection' | 'rightSection'>;

export type AutoCompleteProps<T> = {
  onChange: (value: string) => void;
  suggestions: T[];
  onUpdateSuggestions: (input: string) => void;
  onSelectSuggestion: (suggestion: T) => void;
  getSuggestionValue: (suggestion: T) => string;
  inputStyle?: MantineStyleProp;
  autoHideErrorText?: boolean;
} & AutoCompletePassthroughProps;

export const AutoComplete = <T,>({
  id,
  suggestions,
  onSelectSuggestion,
  onChange,
  onUpdateSuggestions,
  getSuggestionValue,
  errorText,
  onAdd,
  // Destructure custom props so they don't get spread to the DOM
  fullWidth: _fullWidth,
  inputClassName: _inputClassName,
  autoHideErrorText: _autoHideErrorText,
  inputStyle: _inputStyle,
  ...props
}: AutoCompleteProps<T>): React.ReactElement => {
  const suggestionMap = React.useMemo(() => {
    const map = new Map<string, T>();
    suggestions.forEach(s => map.set(getSuggestionValue(s), s));
    return map;
  }, [suggestions, getSuggestionValue]);

  const data = React.useMemo(
    () => suggestions.map(s => getSuggestionValue(s)),
    [suggestions, getSuggestionValue],
  );

  const handleChange = React.useCallback(
    (val: string) => {
      onChange(val);
      onUpdateSuggestions(val);
    },
    [onChange, onUpdateSuggestions],
  );

  const handleOptionSubmit = React.useCallback(
    (val: string) => {
      const suggestion = suggestionMap.get(val);
      if (suggestion) {
        logger.info({ value: val }, 'Selected suggestion');
        onSelectSuggestion(suggestion);
      }
    },
    [suggestionMap, onSelectSuggestion],
  );

  return (
    <MantineAutocomplete
      id={id}
      w="100%"
      onChange={handleChange}
      onOptionSubmit={handleOptionSubmit}
      data={data}
      error={errorText || undefined}
      spellCheck={false}
      rightSection={
        onAdd ? (
          <ActionIcon onClick={onAdd} size="sm">
            <Icons.Add />
          </ActionIcon>
        ) : undefined
      }
      {...props}
    />
  );
};
