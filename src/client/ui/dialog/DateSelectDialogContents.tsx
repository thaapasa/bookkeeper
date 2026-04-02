import { Button, Group } from '@mantine/core';
import { DatePicker } from '@mantine/dates';
import { DateTime } from 'luxon';
import * as React from 'react';

import { DateSelectDialogData, DialogContentRendererProps } from './Dialog';

type TextPromptDialogProps = DialogContentRendererProps<DateTime> & DateSelectDialogData;

export const DateSelectDialogComponent: React.FC<TextPromptDialogProps> = ({
  onSelect,
  initialDate,
  handleKeyPress,
  onCancel,
}) => {
  const [date, setDate] = React.useState<DateTime | undefined>(initialDate);

  const changeHandler = (edited: string | null) => {
    if (edited) {
      const dt = DateTime.fromISO(edited);
      if (dt.isValid) {
        setDate(dt);
      }
    }
  };
  return (
    <>
      <DatePicker value={date?.toISODate() ?? null} onChange={changeHandler} />
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
