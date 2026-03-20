import styled from '@emotion/styled';
import { Checkbox, Radio } from '@mantine/core';
import * as React from 'react';
import { z } from 'zod';

import { SubscriptionSearchCriteria } from 'shared/expense';
import { isSameInterval, MomentInterval } from 'shared/time';
import { isDefined } from 'shared/types';

import { useLocalStorage } from '../hooks/useLocalStorage';
import { media } from '../Styles';

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
  const [range, setRange] = useLocalStorage<MomentInterval>(
    'subscriptions.range',
    { amount: 5, unit: 'years' },
    MomentInterval,
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
    <CriteriaGrid>
      <FilterGroup>
        <Checkbox checked={includeEnded} onChange={() => setIncludeEnded(!includeEnded)} label="Myös loppuneet" />
        <Checkbox checked={onlyOwn} onChange={() => setOnlyOwn(!onlyOwn)} label="Vain omat" />
      </FilterGroup>
      <FilterGroup style={{ justifyContent: 'center' }}>
        {rangeOptions.map(r => (
          <Radio
            key={r.label}
            checked={isSameInterval(r.range, range)}
            onChange={() => setRange(r.range)}
            label={r.label}
          />
        ))}
      </FilterGroup>
      <FilterGroup style={{ justifyContent: 'flex-end' }}>
        <Checkbox checked={expenses} onChange={() => setExpenses(!expenses)} label="Menot" />
        <Checkbox checked={incomes} onChange={() => setIncomes(!incomes)} label="Tulot" />
        <Checkbox checked={transfers} onChange={() => setTranfers(!transfers)} label="Siirrot" />
      </FilterGroup>
    </CriteriaGrid>
  );
};

const CriteriaGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  width: 100%;
  padding: 0 16px;
  gap: 8px;
  ${media.web`grid-template-columns: 1fr 1fr 1fr;`}
`;

const FilterGroup = styled.div`
  display: flex;
  flex-direction: row;
  gap: 8px;
  flex-wrap: wrap;
`;
