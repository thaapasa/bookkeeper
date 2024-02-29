import styled from '@emotion/styled';
import {
  Autocomplete,
  AutocompleteChangeReason,
  AutocompleteInputChangeReason,
  IconButton,
  InputAdornment,
  TextField,
} from '@mui/material';
import React from 'react';

import { spaced } from 'shared/util';
import { logger } from 'client/Logger';

import { Icons } from '../icons/Icons';

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
  onAdd?: () => void;
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
  onAdd,
}) => {
  const onChangeHandler = React.useCallback(
    (_event: React.SyntheticEvent, value: string | null, reason: AutocompleteChangeReason) => {
      switch (reason) {
        case 'selectOption':
          logger.info(`Selected suggestion: %s`, value);
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
          logger.info(`Input from textfield: ${value}`);
          onChange(value);
          onUpdateSuggestions(value);
          return;
      }
    },
    [onChange, onUpdateSuggestions],
  );

  const defaultErrorText = autoHideErrorText ? null : ' ';
  const hasAdornments = !!onAdd;

  return (
    <StyledAutocomplete
      id={id}
      className={className + (hasAdornments ? ' adorned' : '')}
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
          InputProps={{
            ...params.InputProps,
            endAdornment: hasAdornments ? (
              <InputAdornment position="end">
                <IconButton onClick={onAdd}>
                  <Icons.Add />
                </IconButton>
              </InputAdornment>
            ) : undefined,
          }}
        />
      )}
      fullWidth={fullWidth}
      options={suggestions}
      onChange={onChangeHandler}
      onInputChange={onInputChangeHandler}
      getOptionLabel={getSuggestionValue}
      style={style}
    />
  );
};

const StyledAutocomplete = styled(Autocomplete)`
  &.adorned .MuiAutocomplete-inputRoot {
    padding-right: 0 !important;
  }
` as typeof Autocomplete;
