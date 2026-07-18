import { Box, FileButton, Stack, Text } from '@mantine/core';
import React from 'react';

import { notifyError } from 'client/data/NotificationStore';

import { Icons } from '../icons/Icons';

interface StatementDropZoneProps {
  onFile: (filename: string, content: string) => void;
}

/**
 * Drag-and-drop target (with click-to-browse fallback) for statement CSV
 * files. Reads the dropped file as text and passes it to the parent.
 */
export const StatementDropZone: React.FC<StatementDropZoneProps> = ({ onFile }) => {
  const [dragOver, setDragOver] = React.useState(false);
  const resetRef = React.useRef<() => void>(null);

  const readFile = async (file: File | null) => {
    if (!file) {
      return;
    }
    // Reset the file input so re-selecting the same file fires again
    resetRef.current?.();
    try {
      onFile(file.name, await file.text());
    } catch (e) {
      notifyError('Tiedoston lukeminen epäonnistui', e);
    }
  };

  return (
    <FileButton resetRef={resetRef} onChange={file => void readFile(file)} accept=".csv,text/csv">
      {({ onClick }) => (
        <Box
          p="xl"
          bd={`2px dashed ${dragOver ? 'var(--mantine-color-primary-5)' : 'var(--mantine-color-default-border)'}`}
          bg={dragOver ? 'primary.0' : undefined}
          style={{ borderRadius: 'var(--mantine-radius-md)', cursor: 'pointer' }}
          onClick={onClick}
          onDragOver={e => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => {
            e.preventDefault();
            setDragOver(false);
            void readFile(e.dataTransfer.files?.[0] ?? null);
          }}
        >
          <Stack gap="xs" align="center">
            <Icons.Upload size={32} />
            <Text fz="md" fw={600}>
              Pudota tiliote tähän
            </Text>
            <Text fz="sm" c="dimmed">
              tai napsauta valitaksesi CSV-tiedoston (OP tai S-pankki)
            </Text>
          </Stack>
        </Box>
      )}
    </FileButton>
  );
};
