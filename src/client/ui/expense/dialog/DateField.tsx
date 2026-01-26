import { DatePicker } from '@mui/x-date-pickers';
import { DateTime } from 'luxon';
import * as React from 'react';

interface DateFieldProps {
  value: DateTime;
  onChange: (date: DateTime) => void;
}

export const datePickerFormat = 'dd.MM.yyyy';

export const DateField: React.FC<DateFieldProps> = ({ value, onChange }) => {
  const changeHandler = React.useCallback(
    (date: DateTime | null) => {
      if (date?.isValid) {
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
