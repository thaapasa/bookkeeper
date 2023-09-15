import { DatePicker } from '@mui/x-date-pickers';
import { Dayjs } from 'dayjs';
import * as React from 'react';

interface DateFieldProps {
  value: Dayjs;
  onChange: (date: Dayjs) => void;
}

export const datePickerFormat = 'DD.MM.YYYY';

export const DateField: React.FC<DateFieldProps> = ({ value, onChange }) => {
  const changeHandler = React.useCallback(
    (date: Dayjs | null) => {
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
