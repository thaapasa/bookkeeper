import { Button, DialogActions, DialogContent } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { Dayjs } from 'dayjs';
import * as React from 'react';

import { datePickerFormat } from '../expense/dialog/DateField';
import { DateSelectDialogData, DialogContentRendererProps } from './Dialog';

type TextPromptDialogProps = DialogContentRendererProps<Dayjs> & DateSelectDialogData;

export const DateSelectDialogComponent: React.FC<TextPromptDialogProps> = ({
  onSelect,
  initialDate,
  handleKeyPress,
  onCancel,
}) => {
  const [date, setDate] = React.useState<Dayjs | undefined>(initialDate);

  const changeHandler = (edited: Dayjs | null) => {
    const date = edited?.isValid() ? edited : undefined;
    if (date) {
      setDate(date);
    }
  };
  return (
    <>
      <DialogContent>
        <DatePicker format={datePickerFormat} value={date} onChange={changeHandler} />
      </DialogContent>
      <DialogActions>
        <Button color="primary" variant="text" onKeyUp={handleKeyPress} onClick={onCancel}>
          Peruuta
        </Button>
        <Button
          color="primary"
          variant="contained"
          onKeyUp={handleKeyPress}
          disabled={!date}
          onClick={() => (date ? onSelect(date) : undefined)}
        >
          Valitse
        </Button>
      </DialogActions>
    </>
  );
};
