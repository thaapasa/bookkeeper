import styled from '@emotion/styled';
import { Pill } from '@mantine/core';
import * as React from 'react';

import { identity, noop } from 'shared/util';

import { AutoComplete } from './AutoComplete';
import { FlexColumn } from './BasicElements';

interface TagsPickerProps {
  value: string[];
  presetValues: string[];
  onAdd(value: string): void;
  onRemove(value: string): void;
}

export const TagsPicker: React.FC<TagsPickerProps> = ({ value, presetValues, onAdd, onRemove }) => {
  const [tag, setTag] = React.useState('');
  return (
    <FlexColumn>
      <TagGrid className="vcenter">
        {value.map(v => (
          <StyledPill key={v} withRemoveButton onRemove={() => onRemove(v)}>
            {v}
          </StyledPill>
        ))}
      </TagGrid>
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
    </FlexColumn>
  );
};

const StyledPill = styled(Pill)`
  margin-right: 8px;
  margin-bottom: 8px;
` as any;

const TagGrid = styled.div`
  display: inline-block;
`;
