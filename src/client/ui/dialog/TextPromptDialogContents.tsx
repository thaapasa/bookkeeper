import { Box, Button, Group } from '@mantine/core';
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
      <Box onKeyUp={handleKeyPress}>
        <Box mb="xs">{description}</Box>
        <Editor value={text} onChange={setText} width="400px" />
      </Box>
      <Group justify="flex-end" gap="xs" pt="md">
        <Button variant="subtle" onKeyUp={handleKeyPress} onClick={() => onCancel()}>
          Peruuta
        </Button>
        <Button variant="filled" onKeyUp={handleKeyPress} onClick={() => onSelect(text)}>
          OK
        </Button>
      </Group>
    </>
  );
};
