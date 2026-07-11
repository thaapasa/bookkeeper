import { Box, Button } from '@mantine/core';
import * as React from 'react';

import { DialogContentRendererProps, OptionSelectDialogData } from './Dialog';
import { DialogFooter } from './DialogFooter';

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
      <Box onKeyUp={handleKeyPress}>{description}</Box>
      <DialogFooter onCancel={onCancel} handleKeyPress={handleKeyPress}>
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
      </DialogFooter>
    </>
  );
};
