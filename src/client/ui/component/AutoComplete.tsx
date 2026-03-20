import styled from '@emotion/styled';
import { ActionIcon, Autocomplete as MantineAutocomplete } from '@mantine/core';
import React from 'react';

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

export const AutoComplete = <T,>({
  id,
  value,
  suggestions,
  onSelectSuggestion,
  onChange,
  onUpdateSuggestions,
  getSuggestionValue,
  style,
  autoFocus,
  placeholder,
  label,
  onKeyUp,
  errorText,
  className,
  onAdd,
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
    <Container className={className} style={style}>
      <MantineAutocomplete
        id={id}
        value={value}
        onChange={handleChange}
        onOptionSubmit={handleOptionSubmit}
        data={data}
        label={label}
        placeholder={placeholder}
        error={errorText || undefined}
        autoFocus={autoFocus}
        spellCheck={false}
        onKeyUp={onKeyUp}
        rightSection={
          onAdd ? (
            <ActionIcon variant="subtle" onClick={onAdd} size="sm">
              <Icons.Add />
            </ActionIcon>
          ) : undefined
        }
      />
    </Container>
  );
};

const Container = styled.div`
  width: 100%;
`;
