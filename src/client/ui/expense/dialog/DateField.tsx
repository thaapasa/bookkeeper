import { TextField } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { Moment } from 'moment';
import * as React from 'react';

interface DateFieldProps {
  value: Date;
  onChange: (date: Date) => void;
}

export const datePickerFormat = 'DD.MM.YYYY';

export const DateField: React.FC<DateFieldProps> = ({ value, onChange }) => {
  const changeHandler = React.useCallback(
    (date: Moment | null) => {
      if (date?.isValid()) {
        onChange(date.toDate());
      }
    },
    [onChange]
  );

  return (
    <DatePicker
      label="Päivämäärä"
      inputFormat={datePickerFormat}
      value={value}
      onChange={changeHandler}
      renderInput={params => <TextField {...params} variant="standard" />}
    />
  );
};
