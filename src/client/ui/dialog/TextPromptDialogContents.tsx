import { Button, DialogActions, DialogContent, TextField } from '@mui/material';
import * as React from 'react';

import { DialogContentRendererProps, TextPromptDialogData } from './Dialog';

type TextPromptDialogProps = DialogContentRendererProps<string> &
  TextPromptDialogData;

export const TextPromptDialogContents: React.FC<TextPromptDialogProps> = ({
  handleKeyPress,
  onSelect,
  onCancel,
  description,
  initialText,
}) => {
  const [text, setText] = React.useState(initialText ?? '');
  return (
    <>
      <DialogContent onKeyUp={handleKeyPress}>{description}</DialogContent>
      <DialogContent onKeyUp={handleKeyPress}>
        <TextField value={text} onChange={e => setText(e.target.value)} />
      </DialogContent>
      <DialogActions>
        <Button
          color="primary"
          variant="text"
          onKeyUp={handleKeyPress}
          onClick={() => onCancel()}
        >
          Peruuta
        </Button>
        <Button
          color="primary"
          variant="contained"
          onKeyUp={handleKeyPress}
          onClick={() => onSelect(text)}
        >
          OK
        </Button>
      </DialogActions>
    </>
  );
};
