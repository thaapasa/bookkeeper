import { Checkbox, FormControlLabel, FormGroup } from '@mui/material';
import * as React from 'react';
import { z } from 'zod';

import { RecurringExpenseCriteria } from 'shared/expense';

import { useLocalStorage } from '../hooks/useLocalStorage';
import { RowElement } from './layout';

export const SubscriptionCriteriaSelector: React.FC<{
  onChange: (criteria: RecurringExpenseCriteria) => void;
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
  React.useEffect(
    () => onChange({ includeEnded, onlyOwn, type: 'expense' }),
    [onChange, includeEnded, onlyOwn]
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
    </RowElement>
  );
};
