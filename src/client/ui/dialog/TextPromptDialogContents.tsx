import { Box } from '@mantine/core';
import * as React from 'react';

import { TextEdit } from '../component/TextEdit';
import { DialogContentRendererProps, TextPromptDialogData } from './Dialog';
import { DialogFooter } from './DialogFooter';

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
      <Box onKeyUp={handleKeyPress}>
        <Box mb="xs">{description}</Box>
        <Editor value={text} onChange={setText} width="400px" />
      </Box>
      <DialogFooter
        onCancel={onCancel}
        onOk={() => onSelect(text)}
        handleKeyPress={handleKeyPress}
      />
    </>
  );
};
