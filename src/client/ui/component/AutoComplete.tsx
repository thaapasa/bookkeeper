import { Autocomplete, AutocompleteChangeReason, AutocompleteInputChangeReason, TextField } from '@mui/material';
import debug from 'debug';
import React from 'react';

import { spaced } from 'shared/util';

const log = debug('ui:autocomplete');

export interface AutoCompleteProps<T> {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  suggestions: T[];
  onUpdateSuggestions: (input: string) => void;
  onSelectSuggestion: (suggestion: T) => void;
  getSuggestionValue: (suggestion: T) => string;
  fullWidth?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
  style?: React.CSSProperties;
  inputStyle?: React.CSSProperties;
  label?: string;
  errorText?: string;
  autoHideErrorText?: boolean;
  onKeyUp?: (event: React.KeyboardEvent<any>) => void;
  className?: string;
  inputClassName?: string;
}

export const AutoComplete: React.FC<AutoCompleteProps<any>> = ({
  id,
  value,
  suggestions,
  onSelectSuggestion,
  onChange,
  onUpdateSuggestions,
  getSuggestionValue,
  fullWidth,
  style,
  inputStyle,
  autoFocus,
  placeholder,
  label,
  onKeyUp,
  errorText,
  autoHideErrorText,
  className,
  inputClassName,
}) => {
  const onChangeHandler = React.useCallback(
    (_event: React.SyntheticEvent, value: string | null, reason: AutocompleteChangeReason) => {
      switch (reason) {
        case 'selectOption':
          log(`Selected suggestion:`, value);
          onSelectSuggestion(value);
          return;
      }
    },
    [onSelectSuggestion],
  );

  const onInputChangeHandler = React.useCallback(
    (_event: React.SyntheticEvent, value: string, reason: AutocompleteInputChangeReason) => {
      switch (reason) {
        case 'input':
          log(`Input from textfield: ${value}`);
          onChange(value);
          onUpdateSuggestions(value);
          return;
      }
    },
    [onChange, onUpdateSuggestions],
  );

  const defaultErrorText = autoHideErrorText ? null : ' ';

  return (
    <Autocomplete
      id={id}
      inputValue={value}
      renderInput={params => (
        <TextField
          {...params}
          variant="standard"
          spellCheck={false}
          autoFocus={autoFocus}
          label={label}
          placeholder={placeholder}
          error={Boolean(errorText)}
          helperText={errorText || defaultErrorText}
          className={spaced`autocomplete-input ${inputClassName}`}
          onKeyUp={onKeyUp}
          style={inputStyle}
        />
      )}
      fullWidth={fullWidth}
      options={suggestions}
      onChange={onChangeHandler}
      onInputChange={onInputChangeHandler}
      getOptionLabel={getSuggestionValue}
      style={style}
      className={className}
    />
  );
};
