import { Button, DialogActions, DialogContent, TextField } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import * as React from 'react';

import { datePickerFormat } from '../expense/dialog/DateField';
import { DateSelectDialogData, DialogContentRendererProps } from './Dialog';

type TextPromptDialogProps = DialogContentRendererProps<Date> &
  DateSelectDialogData;

export const DateSelectDialogComponent: React.FC<TextPromptDialogProps> = ({
  onSelect,
  initialDate,
  handleKeyPress,
  onCancel,
}) => {
  const [date, setDate] = React.useState<Date | undefined>(initialDate);

  const changeHandler = (edited: any | null) => {
    const date = edited && edited.isValid() ? edited.toDate() : undefined;
    if (date) {
      setDate(date);
    }
  };
  return (
    <>
      <DialogContent>
        <DatePicker
          inputFormat={datePickerFormat}
          value={date}
          onChange={changeHandler}
          renderInput={params => <TextField {...params} variant="standard" />}
        />
      </DialogContent>
      <DialogActions>
        <Button
          color="primary"
          variant="text"
          onKeyUp={handleKeyPress}
          onClick={onCancel}
        >
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
