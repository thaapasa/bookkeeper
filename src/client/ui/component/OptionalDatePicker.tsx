import { Checkbox, Group } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import React from 'react';

import { ISODate, toISODate } from 'shared/time';
import { isDefined } from 'shared/types';

interface OptionalDatePickerProps {
  value: ISODate | null;
  onChange: (value: ISODate | null) => void;
}

export const OptionalDatePicker: React.FC<OptionalDatePickerProps> = ({ value, onChange }) => {
  const today = toISODate();
  const hasDate = isDefined(value);

  return (
    <Group align="center" wrap="nowrap">
      <Checkbox checked={hasDate} onChange={() => onChange(hasDate ? null : today)} />
      <DatePickerInput
        disabled={!hasDate}
        valueFormat="DD.MM.YYYY"
        value={value ? value : null}
        onChange={v => onChange(v ? (v as ISODate) : null)}
      />
    </Group>
  );
};
