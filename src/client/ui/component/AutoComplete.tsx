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
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  onAdd?: () => void;
  className?: string;
  inputClassName?: string;
} & BoxProps &
  Pick<MantineAutocompleteProps, 'leftSection' | 'rightSection'>;

export type AutoCompleteProps<T> = {
  /** Called when the user types. NOT called when a suggestion is selected. */
  onChange: (value: string) => void;
  suggestions: T[];
  onUpdateSuggestions: (input: string) => void;
  /**
   * Called when the user selects a suggestion. onChange is suppressed for this
   * interaction — the caller is responsible for updating the input value if desired
   * (e.g., by calling onChange manually with a transformed value).
   */
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
  onKeyDown,
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

  // Mantine's Autocomplete fires onOptionSubmit synchronously, then onChange with the
  // raw suggestion text in the same interaction cycle. We suppress that follow-up
  // onChange so callers get a clean separation: onSelectSuggestion for selection,
  // onChange for typing only. The caller can update the input value from within
  // onSelectSuggestion if needed.
  const optionSubmittedRef = React.useRef(false);

  const handleChange = React.useCallback(
    (val: string) => {
      if (optionSubmittedRef.current) {
        optionSubmittedRef.current = false;
        return;
      }
      onChange(val);
      onUpdateSuggestions(val);
    },
    [onChange, onUpdateSuggestions],
  );

  const handleOptionSubmit = React.useCallback(
    (val: string) => {
      optionSubmittedRef.current = true;
      const suggestion = suggestionMap.get(val);
      if (suggestion) {
        logger.info({ value: val }, 'Selected suggestion');
        onSelectSuggestion(suggestion);
      }
    },
    [suggestionMap, onSelectSuggestion],
  );

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Mantine consumes Enter only when the dropdown is open AND an option is
      // highlighted, which is exactly when it sets aria-activedescendant on the input.
      // In that case Enter selects the suggestion, so it must not reach parent handlers
      // (e.g. ActivatableTextField's commit), which would otherwise fire first.
      if (e.key === 'Enter' && e.currentTarget.getAttribute('aria-activedescendant')) {
        e.stopPropagation();
      } else {
        onKeyDown?.(e);
      }
    },
    [onKeyDown],
  );

  return (
    <MantineAutocomplete
      id={id}
      w="100%"
      onChange={handleChange}
      onOptionSubmit={handleOptionSubmit}
      onKeyDown={handleKeyDown}
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
