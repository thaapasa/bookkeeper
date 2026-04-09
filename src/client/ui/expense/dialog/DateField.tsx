import { DatePickerInput, DatePickerInputProps } from '@mantine/dates';
import * as React from 'react';

import { ISODate, toISODate } from 'shared/time';

type DateFieldProps = {
  value: ISODate;
  onChange: (date: ISODate) => void;
} & Omit<DatePickerInputProps, 'value' | 'onChange'>;

export const datePickerFormat = 'DD.MM.YYYY';

export const DateField: React.FC<DateFieldProps> = ({ value, onChange, ...props }) => {
  const changeHandler = React.useCallback(
    (date: string | null) => {
      if (date) {
        onChange(toISODate(date));
      }
    },
    [onChange],
  );

  return (
    <DatePickerInput
      label="Päivämäärä"
      valueFormat={datePickerFormat}
      value={value}
      onChange={changeHandler}
      {...props}
    />
  );
};
