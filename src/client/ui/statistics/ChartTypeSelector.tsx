import {
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
} from '@mui/material';
import * as React from 'react';

import { StatisticsChartType } from './types';

const TypeLabels: Record<StatisticsChartType, string> = {
  years: 'Vuodet',
  months: 'Kuukaudet',
  recurring: 'Vuositoisto',
};

export const StatisticsChartTypeSelector: React.FC<{
  selected: StatisticsChartType;
  onChange: (type: StatisticsChartType) => void;
}> = ({ selected, onChange }) => (
  <FormControl>
    <FormLabel>Tyyppi</FormLabel>
    <RadioGroup row>
      {StatisticsChartType.options.map(type => (
        <FormControlLabel
          key={type}
          value={type}
          control={<Radio checked={selected === type} />}
          label={TypeLabels[type]}
          onChange={() => onChange(type)}
        />
      ))}
    </RadioGroup>
  </FormControl>
);
