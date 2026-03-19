import styled from '@emotion/styled';
import { DialogActions, DialogContent } from '@mui/material';
import { Button } from '@mantine/core';
import * as React from 'react';

import { TextEdit } from '../component/TextEdit';
import { DialogContentRendererProps, TextPromptDialogData } from './Dialog';

type TextPromptDialogProps = DialogContentRendererProps<string> & TextPromptDialogData;

export const TextPromptDialogContents: React.FC<TextPromptDialogProps> = ({
  handleKeyPress,
  onSelect,
  onCancel,
  description,
  initialText,
  editorType,
}) => {
  const [text, setText] = React.useState(initialText ?? '');
  const Editor = (editorType ?? TextEdit) as any;
  return (
    <>
      <DialogContent onKeyUp={handleKeyPress}>
        <Description>{description}</Description>
        <Editor value={text} onChange={setText} width="400px" />
      </DialogContent>
      <DialogActions>
        <Button variant="subtle" onKeyUp={handleKeyPress} onClick={() => onCancel()}>
          Peruuta
        </Button>
        <Button variant="filled" onKeyUp={handleKeyPress} onClick={() => onSelect(text)}>
          OK
        </Button>
      </DialogActions>
    </>
  );
};

const Description = styled.div`
  margin-bottom: 8px;
`;
