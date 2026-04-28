import { Checkbox, Group, Radio, SimpleGrid } from '@mantine/core';
import * as React from 'react';
import { z } from 'zod';

import { SubscriptionSearchCriteria } from 'shared/expense';
import { isSameInterval, RecurrenceInterval } from 'shared/time';
import { isDefined } from 'shared/types';

import { useLocalStorage } from '../hooks/useLocalStorage';

interface RangeOption {
  range: RecurrenceInterval;
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
  // Bumped key suffix: the previous default hid ended rows, which made
  // a freshly-ended ("Lopeta") subscription disappear and confused the
  // dominator-reference path ("Päällekkäinen tilauksen kanssa: X"
  // pointing at an invisible row). Keeping ended rows visible by
  // default lets the user explicitly delete ("Poista") them when ready.
  const [includeEnded, setIncludeEnded] = useLocalStorage(
    'subscriptions.includeEnded.v2',
    true,
    z.boolean(),
  );
  const [onlyOwn, setOnlyOwn] = useLocalStorage('subscriptions.onlyOwn', false, z.boolean());
  const [expenses, setExpenses] = useLocalStorage('subscriptions.type.expense', true, z.boolean());
  const [incomes, setIncomes] = useLocalStorage('subscriptions.type.income', false, z.boolean());
  const [transfers, setTranfers] = useLocalStorage(
    'subscriptions.type.transfer',
    false,
    z.boolean(),
  );
  const [range, setRange] = useLocalStorage<RecurrenceInterval>(
    'subscriptions.range',
    { amount: 5, unit: 'years' },
    RecurrenceInterval,
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
    [onChange, includeEnded, onlyOwn, expenses, incomes, transfers, range],
  );

  return (
    <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="xs" w="100%" px="md" py="sm">
      <Group gap="sm" wrap="wrap">
        <Checkbox
          checked={includeEnded}
          onChange={() => setIncludeEnded(!includeEnded)}
          label="Näytä päättyneet"
        />
        <Checkbox checked={onlyOwn} onChange={() => setOnlyOwn(!onlyOwn)} label="Vain omat" />
      </Group>
      <Group gap="sm" wrap="wrap" justify="center">
        {rangeOptions.map(r => (
          <Radio
            key={r.label}
            checked={isSameInterval(r.range, range)}
            onChange={() => setRange(r.range)}
            label={r.label}
          />
        ))}
      </Group>
      <Group gap="sm" wrap="wrap" justify="flex-end">
        <Checkbox checked={expenses} onChange={() => setExpenses(!expenses)} label="Menot" />
        <Checkbox checked={incomes} onChange={() => setIncomes(!incomes)} label="Tulot" />
        <Checkbox checked={transfers} onChange={() => setTranfers(!transfers)} label="Siirrot" />
      </Group>
    </SimpleGrid>
  );
};
