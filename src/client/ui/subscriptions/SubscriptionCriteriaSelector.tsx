import { Checkbox, FormControlLabel, FormGroup } from '@mui/material';
import * as React from 'react';
import { z } from 'zod';

import { SubscriptionSearchCriteria } from 'shared/expense';
import { isDefined } from 'shared/types';

import { useLocalStorage } from '../hooks/useLocalStorage';
import { Flex } from '../Styles';
import { RowElement } from './layout';

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
      }),
    [onChange, includeEnded, onlyOwn, expenses, incomes, transfers]
  );

  return (
    <RowElement>
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
      </FormGroup>
      <FormGroup row>
        <FormControlLabel
          control={
            <Checkbox checked={onlyOwn} onChange={() => setOnlyOwn(!onlyOwn)} />
          }
          label="Vain omat"
        />
      </FormGroup>
      <Flex />
      <FormGroup row>
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
            <Checkbox checked={incomes} onChange={() => setIncomes(!incomes)} />
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
    </RowElement>
  );
};
