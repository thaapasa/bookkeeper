import { DatePicker } from '@mantine/dates';
import * as React from 'react';

import { ISODate, toISODate } from 'shared/time';

import { DateSelectDialogData, DialogContentRendererProps } from './Dialog';
import { DialogFooter } from './DialogFooter';

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
      <DatePicker value={date ?? null} defaultDate={date ?? undefined} onChange={changeHandler} />
      <DialogFooter
        onCancel={onCancel}
        onOk={() => (date ? onSelect(date) : undefined)}
        okLabel="Valitse"
        okDisabled={!date}
        handleKeyPress={handleKeyPress}
      />
    </>
  );
};
