import {
  Checkbox,
  FormControlLabel,
  FormGroup,
  Grid,
  Radio,
} from '@mui/material';
import * as React from 'react';
import { z } from 'zod';

import { SubscriptionSearchCriteria } from 'shared/expense';
import { isSameInterval, MomentInterval } from 'shared/time';
import { isDefined } from 'shared/types';

import { useLocalStorage } from '../hooks/useLocalStorage';

interface RangeOption {
  range: MomentInterval;
  label: string;
}

const rangeOptions = [
  { label: '1v', range: { amount: 1, unit: 'years' } },
  { label: '3v', range: { amount: 3, unit: 'years' } },
  { label: '5v', range: { amount: 5, unit: 'years' } },
] satisfies RangeOption[];

export const SubscriptionCriteriaSelector: React.FC<{
  onChange: (criteria: SubscriptionSearchCriteria) => void;
}> = ({ onChange }) => {
  const [includeEnded, setIncludeEnded] = useLocalStorage(
    'subscriptions.includeEnded',
    false,
    z.boolean()
  );
  const [onlyOwn, setOnlyOwn] = useLocalStorage(
    'subscriptions.onlyOwn',
    false,
    z.boolean()
  );
  const [expenses, setExpenses] = useLocalStorage(
    'subscriptions.type.expense',
    true,
    z.boolean()
  );
  const [incomes, setIncomes] = useLocalStorage(
    'subscriptions.type.income',
    false,
    z.boolean()
  );
  const [transfers, setTranfers] = useLocalStorage(
    'subscriptions.type.transfer',
    false,
    z.boolean()
  );
  const [range, setRange] = useLocalStorage<MomentInterval>(
    'subscriptions.range',
    { amount: 5, unit: 'years' },
    MomentInterval
  );
  React.useEffect(
    () =>
      onChange({
        includeEnded,
        onlyOwn,
        type: [
          expenses ? ('expense' as const) : undefined,
          incomes ? ('income' as const) : undefined,
          transfers ? ('transfer' as const) : undefined,
        ].filter(isDefined),
        range,
      }),
    [onChange, includeEnded, onlyOwn, expenses, incomes, transfers, range]
  );

  return (
    <Grid container width="100%" paddingLeft={2} paddingRight={2}>
      <Grid item xs={12} md={4}>
        <FormGroup row>
          <FormControlLabel
            control={
              <Checkbox
                checked={includeEnded}
                onChange={() => setIncludeEnded(!includeEnded)}
              />
            }
            label="Myös loppuneet"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={onlyOwn}
                onChange={() => setOnlyOwn(!onlyOwn)}
              />
            }
            label="Vain omat"
          />
        </FormGroup>
      </Grid>
      <Grid item xs={12} md={4}>
        <FormGroup row sx={{ justifyContent: 'center' }}>
          {rangeOptions.map(r => (
            <FormControlLabel
              key={r.label}
              control={
                <Radio
                  checked={isSameInterval(r.range, range)}
                  onChange={() => setRange(r.range)}
                />
              }
              label={r.label}
            />
          ))}
        </FormGroup>
      </Grid>
      <Grid item xs={12} md={4}>
        <FormGroup row sx={{ justifyContent: 'right' }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={expenses}
                onChange={() => setExpenses(!expenses)}
              />
            }
            label="Menot"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={incomes}
                onChange={() => setIncomes(!incomes)}
              />
            }
            label="Tulot"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={transfers}
                onChange={() => setTranfers(!transfers)}
              />
            }
            label="Siirrot"
          />
        </FormGroup>
      </Grid>
    </Grid>
  );
};
