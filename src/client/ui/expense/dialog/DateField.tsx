import { DatePickerInput, DatePickerInputProps } from '@mantine/dates';
import { DateTime } from 'luxon';
import * as React from 'react';

type DateFieldProps = {
  value: DateTime;
  onChange: (date: DateTime) => void;
} & Omit<DatePickerInputProps, 'value' | 'onChange'>;

export const datePickerFormat = 'DD.MM.YYYY';

export const DateField: React.FC<DateFieldProps> = ({ value, onChange, ...props }) => {
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
      valueFormat={datePickerFormat}
      value={value.toISODate()}
      onChange={changeHandler}
      {...props}
    />
  );
};
