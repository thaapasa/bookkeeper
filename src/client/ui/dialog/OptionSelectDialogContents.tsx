import { Button, DialogActions, DialogContent } from '@mui/material';
import * as React from 'react';

import { DialogContentRendererProps, OptionSelectDialogData } from './Dialog';

type OptionSelectDialogProps<T> = DialogContentRendererProps<T> &
  OptionSelectDialogData<T>;

export const OptionSelectDialogContents: React.FC<
  OptionSelectDialogProps<any>
> = <T extends string>({
  handleKeyPress,
  onSelect,
  onCancel,
  description,
  options,
}: OptionSelectDialogProps<T>) => {
  return (
    <>
      <DialogContent onKeyUp={handleKeyPress}>{description}</DialogContent>
      <DialogActions>
        <Button
          color="primary"
          variant="text"
          onKeyUp={handleKeyPress}
          onClick={onCancel}
        >
          Peruuta
        </Button>
        {options.map(o => (
          <Button
            key={o.value}
            color="primary"
            variant="contained"
            onKeyUp={handleKeyPress}
            onClick={() => onSelect(o.value)}
          >
            {o.label}
          </Button>
        ))}
      </DialogActions>
    </>
  );
};
