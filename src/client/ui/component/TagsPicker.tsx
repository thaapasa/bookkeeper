import { Box, Stack } from '@mantine/core';
import * as React from 'react';

import { identity, noop } from 'shared/util';

import { AutoComplete } from './AutoComplete';
import { Tag } from './Tag';

interface TagsPickerProps {
  value: string[];
  presetValues: string[];
  onAdd(value: string): void;
  onRemove(value: string): void;
}

export const TagsPicker: React.FC<TagsPickerProps> = ({ value, presetValues, onAdd, onRemove }) => {
  const [tag, setTag] = React.useState('');
  return (
    <Stack gap={0}>
      <Box display="inline-block">
        {value.map(v => (
          <Tag key={v} mr="xs" mb="xs" onRemove={() => onRemove(v)}>
            {v}
          </Tag>
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
