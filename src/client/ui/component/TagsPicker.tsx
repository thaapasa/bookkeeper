import { Box, Pill, Stack } from '@mantine/core';
import * as React from 'react';

import { identity, noop } from 'shared/util';

import { AutoComplete } from './AutoComplete';

interface TagsPickerProps {
  value: string[];
  presetValues: string[];
  onAdd(value: string): void;
  onRemove(value: string): void;
}

export const TagsPicker: React.FC<TagsPickerProps> = ({ value, presetValues, onAdd, onRemove }) => {
  const [tag, setTag] = React.useState('');
  return (
    <Stack>
      <Box display="inline-block">
        {value.map(v => (
          <Pill
            key={v}
            withRemoveButton
            onRemove={() => onRemove(v)}
            mr="xs"
            mb="xs"
            bg="light-dark(var(--mantine-color-neutral-2), var(--mantine-color-neutral-4))"
          >
            {v}
          </Pill>
        ))}
      </Box>
      <AutoComplete
        suggestions={presetValues}
        onSelectSuggestion={s => onAdd(s)}
        value={tag}
        onChange={setTag}
        onUpdateSuggestions={noop}
        getSuggestionValue={identity}
        onKeyUp={e => {
          if (e.key === 'Enter') {
            onAdd(tag);
            setTag('');
          }
        }}
        onAdd={() => {
          onAdd(tag);
          setTag('');
        }}
      />
    </Stack>
  );
};
