import styled from '@emotion/styled';
import { Button } from '@mantine/core';
import * as React from 'react';

import { DialogContentRendererProps, OptionSelectDialogData } from './Dialog';

type OptionSelectDialogProps<T> = DialogContentRendererProps<T> & OptionSelectDialogData<T>;

export const OptionSelectDialogContents: React.FC<OptionSelectDialogProps<any>> = <
  T extends string,
>({
  handleKeyPress,
  onSelect,
  onCancel,
  description,
  options,
}: OptionSelectDialogProps<T>) => {
  return (
    <>
      <div onKeyUp={handleKeyPress}>{description}</div>
      <Actions>
        <Button variant="subtle" onKeyUp={handleKeyPress} onClick={onCancel}>
          Peruuta
        </Button>
        {options.map(o => (
          <Button
            key={o.value}
            variant="filled"
            onKeyUp={handleKeyPress}
            onClick={() => onSelect(o.value)}
          >
            {o.label}
          </Button>
        ))}
      </Actions>
    </>
  );
};

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 16px;
  flex-wrap: wrap;
`;
