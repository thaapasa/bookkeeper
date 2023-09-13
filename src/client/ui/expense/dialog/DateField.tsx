import { DatePicker } from '@mui/x-date-pickers';
import { Moment } from 'moment';
import * as React from 'react';

interface DateFieldProps {
  value: Moment;
  onChange: (date: Moment) => void;
}

export const datePickerFormat = 'DD.MM.YYYY';

export const DateField: React.FC<DateFieldProps> = ({ value, onChange }) => {
  const changeHandler = React.useCallback(
    (date: Moment | null) => {
      if (date?.isValid()) {
        onChange(date);
      }
    },
    [onChange],
  );

  return (
    <DatePicker
      label="Päivämäärä"
      format={datePickerFormat}
      value={value}
      onChange={changeHandler}
    />
  );
};
