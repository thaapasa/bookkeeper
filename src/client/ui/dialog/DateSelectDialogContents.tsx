import { Button, Group } from '@mantine/core';
import { DatePicker } from '@mantine/dates';
import * as React from 'react';

import { ISODate, toISODate } from 'shared/time';

import { DateSelectDialogData, DialogContentRendererProps } from './Dialog';

type TextPromptDialogProps = DialogContentRendererProps<ISODate> & DateSelectDialogData;

export const DateSelectDialogComponent: React.FC<TextPromptDialogProps> = ({
  onSelect,
  initialDate,
  handleKeyPress,
  onCancel,
}) => {
  const [date, setDate] = React.useState<ISODate | undefined>(initialDate);

  const changeHandler = (edited: string | null) => {
    if (edited) {
      setDate(toISODate(edited));
    }
  };
  return (
    <>
      <DatePicker value={date ?? null} onChange={changeHandler} />
      <Group justify="flex-end" gap="xs" pt="md">
        <Button variant="subtle" onKeyUp={handleKeyPress} onClick={onCancel}>
          Peruuta
        </Button>
        <Button
          variant="filled"
          onKeyUp={handleKeyPress}
          disabled={!date}
          onClick={() => (date ? onSelect(date) : undefined)}
        >
          Valitse
        </Button>
      </Group>
    </>
  );
};
