import { DatePickerInput } from '@mantine/dates';
import { DateTime } from 'luxon';
import * as React from 'react';

interface DateFieldProps {
  value: DateTime;
  onChange: (date: DateTime) => void;
}

export const datePickerFormat = 'DD.MM.YYYY';

export const DateField: React.FC<DateFieldProps> = ({ value, onChange }) => {
  const changeHandler = React.useCallback(
    (date: string | null) => {
      if (date) {
        const dt = DateTime.fromISO(date);
        if (dt.isValid) {
          onChange(dt);
        }
      }
    },
    [onChange],
  );

  return (
    <DatePickerInput
      label="Päivämäärä"
      valueFormat="DD.MM.YYYY"
      value={value.toISODate()}
      onChange={changeHandler}
    />
  );
};
