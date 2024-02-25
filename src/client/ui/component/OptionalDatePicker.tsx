import { Checkbox } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import React from 'react';

import { ISODate, toISODate } from 'shared/time';
import { isDefined } from 'shared/types';

import { Row } from './Row';

interface OptionalDatePickerProps {
  value: ISODate | null;
  onChange: (value: ISODate | null) => void;
}

export const OptionalDatePicker: React.FC<OptionalDatePickerProps> = ({ value, onChange }) => {
  const today = toISODate();
  const hasDate = isDefined(value);

  return (
    <Row>
      <Checkbox checked={hasDate} onChange={() => onChange(hasDate ? null : today)} />
      <DatePicker disabled={!hasDate} value={dayjs(value)} onChange={v => onChange(toISODate(v))} />
    </Row>
  );
};
